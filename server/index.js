const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");

dotenv.config(); // Render-safe

const http = require("http");
const server = http.createServer(app);

/* =======================
   SOCKET.IO
======================= */
let io;
try {
    io = require("socket.io")(server, {
        cors: {
            origin: [
                "http://localhost:3000",
                "https://unihub-test.vercel.app",
            ],
            credentials: true,
        },
    });

    global.io = io;

    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);

        socket.on("join_event", (eventId) => {
            socket.join(eventId);
        });

        socket.on("send_message", (data) => {
            io.to(data.eventId).emit("receive_message", data);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected", socket.id);
        });
    });
} catch (e) {
    console.error("Socket init failed:", e);
}

/* =======================
   MIDDLEWARE
======================= */
const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
    cors({
        origin: ["http://localhost:3000", "http://localhost:3001", "https://try-unihub.vercel.app"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

/* =======================
   DATABASE
======================= */
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_ATLAS_URI;
mongoose.set("strictQuery", true);

if (MONGO_URI) {
    mongoose
        .connect(MONGO_URI)
        .then(() => console.log("MongoDB connected"))
        .catch(console.error);
}

/* =======================
   MODELS
======================= */
require("./models/otpAuth");
require("./models/user");
require("./models/admin");
require("./models/event");

/* =======================
   FILE UPLOADS (Cloudinary)
======================= */
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage so we can stream the buffer to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload/image", upload.single("file"), async(req, res) => {
    if (!req.file) return res.status(400).send({ msg: "No file uploaded" });

    try {
        // Upload buffer to Cloudinary via a stream
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({
                    folder: "unihub",
                    resource_type: "image",
                    transformation: [{ quality: "auto", fetch_format: "auto" }],
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        res.send({ url: result.secure_url });
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        res.status(500).send({ msg: "Image upload failed" });
    }
});

/* =======================
   ROUTES
======================= */
app.use("/user", require("./routes/authRoutes"));
app.use("/user", require("./routes/userDashboardRoutes"));
app.use("/", require("./routes/paymentRoute"));
app.use("/", require("./routes/adminRoutes"));
app.use("/", require("./routes/eventRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));
app.use("/community", require("./routes/communityRoutes"));
app.use("/social", require("./routes/userInteractionRoutes"));

/* =======================
   HEALTH
======================= */
app.get("/health", (_req, res) => res.send("OK"));
app.get("/healthz", (_req, res) => res.json({ ok: true }));

/* =======================
   SERVER START
======================= */
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});