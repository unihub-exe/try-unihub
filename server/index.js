require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Security Middleware
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// CORS Configuration
const corsOptions = {
    origin: [
        "http://localhost:3000",
        "https://try-unihub.vercel.app",
        "https://unihub-test.vercel.app",
        "https://*.vercel.app",
        "http://localhost:3001"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Next.js compatibility
    crossOriginEmbedderPolicy: false
}));
app.use(cors(corsOptions));
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
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/unihub";
const mongooseOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

mongoose.connect(MONGO_URI, mongooseOptions)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const communityRoutes = require("./routes/communityRoutes");
const eventRoutes = require("./routes/eventRoutes");
const paymentRoutes = require("./routes/paymentRoute");
const notificationRoutes = require("./routes/notificationRoutes");
const userDashboardRoutes = require("./routes/userDashboardRoutes");
const userInteractionRoutes = require("./routes/userInteractionRoutes");

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/community", communityRoutes);
app.use("/event", eventRoutes);
app.use("/", paymentRoutes);
app.use("/", notificationRoutes);
app.use("/user", userDashboardRoutes);
app.use("/", userInteractionRoutes);

// Image Upload Endpoint with Security
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

// Secure file upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "server/uploads/");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = /jpeg|jpg|png|gif|webp/;
        if (!allowedExtensions.test(ext)) {
            return cb(new Error("Only image files are allowed"), false);
        }
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    }
});

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

app.post("/upload/image", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json({ url: `${baseUrl}/uploads/${req.file.filename}` });
});

// Serve uploaded files securely
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cache-Control", "public, max-age=31536000");
    }
}));

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

        const PORT = process.env.PORT || 5000; server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

        module.exports = { app, server, io };