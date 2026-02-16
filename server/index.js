require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");

const app = express();
const server = http.createServer(app);

// Security Middleware
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://try-unihub.vercel.app",
            "https://unihub-test.vercel.app"
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list or is a vercel.app subdomain
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400 // 24 hours
};

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Next.js compatibility
    crossOriginEmbedderPolicy: false
}));

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting - Critical for security
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { msg: "Too many requests from this IP, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/", limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { msg: "Too many authentication attempts, please try again later" }
});
app.use("/users/signin", authLimiter);
app.use("/users/signup", authLimiter);

// Socket.io Setup
const io = new Server(server, {
    cors: corsOptions,
    pingTimeout: 60000,
    pingInterval: 25000
});

global.io = io;

// Socket Authentication Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
        // Allow connections without token for public events
        return next();
    }
    try {
        const jwt = require("jsonwebtoken");
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = payload;
    } catch (e) {
        // Invalid token, but still allow connection
        console.log("Socket auth error:", e.message);
    }
    next();
});

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join_event", (eventId) => {
        socket.join(`event_${eventId}`);
        console.log(`Socket ${socket.id} joined event_${eventId}`);
    });

    socket.on("leave_event", (eventId) => {
        socket.leave(`event_${eventId}`);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

// Database Connection with security options
const MONGO_URI = process.env.MONGO_ATLAS_URI || process.env.MONGO_URI || "mongodb://localhost:27017/unihub";
const mongooseOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

console.log("Attempting to connect to MongoDB...");
mongoose.connect(MONGO_URI, mongooseOptions)
    .then(() => {
        console.log("✅ MongoDB Connected Successfully");
        
        // Start earnings unlock scheduler
        startEarningsScheduler();
    })
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        console.error("Connection string (masked):", MONGO_URI.replace(/\/\/.*@/, '//***:***@'));
    });

// Earnings unlock scheduler - runs every hour
function startEarningsScheduler() {
    const { unlockEventEarnings } = require("./controllers/walletController");
    const Event = require("./models/event");
    const User = require("./models/user");
    
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        try {
            console.log("Running earnings unlock check...");
            
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            
            // Find events that ended more than 1 hour ago and haven't been unlocked
            const events = await Event.find({
                earningsLocked: true,
                // Event date + time is more than 1 hour ago
            });
            
            for (const event of events) {
                // Parse event date and time
                const [day, month, year] = event.date.split('/');
                const [hours, minutes] = event.time.split(':');
                const eventDateTime = new Date(year, month - 1, day, hours, minutes);
                
                // Check if event ended more than 1 hour ago
                if (eventDateTime < oneHourAgo) {
                    await unlockEventEarnings(event.event_id);
                    event.earningsLocked = false;
                    await event.save();
                }
            }
            
            console.log("Earnings unlock check completed");
        } catch (error) {
            console.error("Earnings unlock scheduler error:", error);
        }
    });
    
    // Auto-unsuspend accounts - runs every hour
    cron.schedule('0 * * * *', async () => {
        try {
            console.log("Running account suspension check...");
            
            const now = new Date();
            
            // Find suspended accounts where suspension has expired
            const result = await User.updateMany(
                {
                    suspended: true,
                    suspendedUntil: { $lt: now }
                },
                {
                    $set: {
                        suspended: false,
                        suspendedUntil: null,
                        suspensionReason: null,
                        accountStatus: 'active'
                    }
                }
            );
            
            if (result.modifiedCount > 0) {
                console.log(`Auto-unsuspended ${result.modifiedCount} accounts`);
            }
        } catch (error) {
            console.error("Account suspension scheduler error:", error);
        }
    });
    
    // Premium event expiry - runs daily at midnight
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log("Running premium event expiry check...");
            
            const now = new Date();
            
            // Find premium events that have expired
            const expiredEvents = await Event.find({
                isPremium: true,
                premiumExpiresAt: { $lt: now }
            });
            
            for (const event of expiredEvents) {
                event.isPremium = false;
                await event.save();
                
                // Notify event owner
                if (event.ownerId) {
                    const { createNotification } = require("./controllers/notificationController");
                    await createNotification(
                        event.ownerId,
                        'premium_expired',
                        'Premium Status Expired',
                        `Your event "${event.name}" premium status has expired. Upgrade again to continue enjoying premium benefits.`,
                        `/event/${event.event_id}/manage`
                    );
                }
            }
            
            if (expiredEvents.length > 0) {
                console.log(`Expired premium status for ${expiredEvents.length} events`);
            }
            
            // Notify events expiring in 24 hours
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const expiringEvents = await Event.find({
                isPremium: true,
                premiumExpiresAt: { $gte: now, $lt: tomorrow }
            });
            
            for (const event of expiringEvents) {
                if (event.ownerId) {
                    const { createNotification } = require("./controllers/notificationController");
                    await createNotification(
                        event.ownerId,
                        'premium_expiring',
                        'Premium Expiring Soon',
                        `Your event "${event.name}" premium status will expire in 24 hours. Renew now to maintain premium benefits.`,
                        `/event/${event.event_id}/premium_payment`
                    );
                }
            }
            
            if (expiringEvents.length > 0) {
                console.log(`Notified ${expiringEvents.length} events expiring soon`);
            }
        } catch (error) {
            console.error("Premium expiry scheduler error:", error);
        }
    });
    
    // Automatic payout processing - runs every hour
    cron.schedule('0 * * * *', async () => {
        try {
            console.log("Running automatic payout processing check...");
            
            const now = new Date();
            const PayoutRequest = require("./models/PayoutRequest");
            
            // Find pending payouts where timer has expired
            const readyPayouts = await PayoutRequest.find({
                status: 'pending',
                scheduledProcessingAt: { $lte: now }
            });
            
            if (readyPayouts.length === 0) {
                console.log("No payouts ready for processing");
                return;
            }
            
            console.log(`Found ${readyPayouts.length} payouts ready for processing`);
            
            // Process each payout via Paystack
            const { createTransferRecipient, initiateTransfer } = require("./utils/paystackTransfer");
            
            for (const payout of readyPayouts) {
                try {
                    // Update status to processing
                    payout.status = 'processing';
                    await payout.save();
                    
                    // Create transfer recipient
                    const recipientResult = await createTransferRecipient({
                        accountName: payout.accountDetails.accountName,
                        accountNumber: payout.accountDetails.accountNumber,
                        bankCode: payout.accountDetails.bankCode
                    });
                    
                    if (!recipientResult.success) {
                        throw new Error(`Failed to create recipient: ${recipientResult.error}`);
                    }
                    
                    // Initiate transfer
                    const transferResult = await initiateTransfer({
                        recipientCode: recipientResult.recipientCode,
                        amount: payout.amount,
                        reason: `UniHub Payout - ${payout._id}`,
                        reference: `PAYOUT_${payout._id}_${Date.now()}`
                    });
                    
                    if (!transferResult.success) {
                        throw new Error(`Failed to initiate transfer: ${transferResult.error}`);
                    }
                    
                    payout.paystackReference = transferResult.reference;
                    payout.status = 'completed';
                    payout.processedAt = new Date();
                    await payout.save();
                    
                    // Update user's pending balance
                    const User = require("./models/user");
                    const user = await User.findOne({ user_token: payout.userId });
                    if (user) {
                        user.wallet.pendingBalance -= payout.amount;
                        await user.save();
                    }
                    
                    // Update transaction status
                    const Transaction = require("./models/Transaction");
                    await Transaction.updateOne(
                        { reference: payout._id.toString() },
                        { status: 'completed' }
                    );
                    
                    // Notify user
                    const { createNotification } = require("./controllers/notificationController");
                    await createNotification(
                        payout.userId,
                        'payout_completed',
                        'Payout Completed',
                        `Your payout of ₦${payout.amount.toLocaleString()} has been processed. Funds will arrive in your bank account within 24 hours (T+1 from Paystack).`,
                        '/users/wallet'
                    );
                    
                    console.log(`Processed payout ${payout._id} for user ${payout.userId}`);
                } catch (payoutError) {
                    console.error(`Error processing payout ${payout._id}:`, payoutError);
                    
                    // Mark as failed
                    payout.status = 'failed';
                    payout.adminNotes = `Auto-processing failed: ${payoutError.message}`;
                    await payout.save();
                    
                    // Notify user
                    const { createNotification } = require("./controllers/notificationController");
                    await createNotification(
                        payout.userId,
                        'payout_failed',
                        'Payout Failed',
                        `Your payout of ₦${payout.amount.toLocaleString()} could not be processed automatically. Our team will review and process it manually.`,
                        '/users/wallet'
                    );
                }
            }
            
            console.log("Automatic payout processing completed");
        } catch (error) {
            console.error("Automatic payout scheduler error:", error);
        }
    });
    
    console.log("Earnings unlock, suspension, premium expiry, and automatic payout schedulers started");
}

// Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const communityRoutes = require("./routes/communityRoutes");
const eventRoutes = require("./routes/eventRoutes");
const paymentRoutes = require("./routes/paymentRoute");
const notificationRoutes = require("./routes/notificationRoutes");
const userDashboardRoutes = require("./routes/userDashboardRoutes");
const userInteractionRoutes = require("./routes/userInteractionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const walletRoutes = require("./routes/walletRoutes");

// Health check endpoint
app.get("/", (req, res) => {
    res.json({ 
        status: "ok", 
        message: "UniHub API is running",
        timestamp: new Date().toISOString()
    });
});

app.get("/health", (req, res) => {
    res.json({ 
        status: "healthy", 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/community", communityRoutes);
app.use("/event", eventRoutes);
app.use("/", paymentRoutes);
app.use("/notifications", notificationRoutes);
app.use("/user", userDashboardRoutes);
app.use("/", userInteractionRoutes);
app.use("/reports", reportRoutes);
app.use("/wallet", walletRoutes);

// Image Upload Endpoint with Cloudinary
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype) return cb(null, true);
        cb(new Error("Invalid file type"));
    }
});

app.post("/upload/image", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Upload to Cloudinary using upload_stream
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "unihub",
                resource_type: "image",
                transformation: [
                    { width: 1200, height: 1200, crop: "limit" },
                    { quality: "auto", fetch_format: "auto" }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return res.status(500).json({ error: "Upload failed", message: error.message });
                }
                res.json({ 
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        );

        // Pipe the buffer to Cloudinary
        const bufferStream = require('stream').Readable.from(req.file.buffer);
        bufferStream.pipe(uploadStream);

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Upload failed", message: error.message });
    }
});

// Serve static files with security headers
app.use(express.static(path.join(__dirname, "../public"), {
    setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "SAMEORIGIN");
        res.setHeader("X-XSS-Protection", "1; mode=block");
    }
}));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Server Error:", err);

    // Security: Don't leak stack traces in production
    const isDevelopment = process.env.NODE_ENV === "development";

    res.status(err.status || 500).json({
        msg: isDevelopment ? err.message : "Internal Server Error",
        ...(isDevelopment && { stack: err.stack })
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ msg: "Route not found" });
});

// Graceful Shutdown
process.on("SIGTERM", async() => {
    console.log("SIGTERM received. Shutting down gracefully...");
    await mongoose.connection.close();
    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});

const PORT = process.env.PORT || 5000;

console.log("Starting server...");
console.log("PORT:", PORT);
console.log("NODE_ENV:", process.env.NODE_ENV || 'development');

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Server is ready to accept connections`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    }
});

module.exports = { app, server, io };