const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Admin = require("./models/admin");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGO_ATLAS_URI || process.env.MONGODB_URI;

async function initializeAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Admin credentials
        const adminEmail = "admin@unihub.com";
        const adminPassword = "unihub2026";
        const adminName = "UniHub Admin";

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log(`Admin with email ${adminEmail} already exists.`);
            process.exit(0);
        }

        // Create JWT token
        const payload = { email: adminEmail };
        const token = jwt.sign(payload, JWT_SECRET);

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create admin
        const newAdmin = new Admin({
            admin_id: token,
            email: adminEmail,
            name: adminName,
            pass: hashedPassword,
        });

        await newAdmin.save();
        console.log("✅ Admin account created successfully!");
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log("\n⚠️  Please change the password after first login for security.");

        process.exit(0);
    } catch (error) {
        console.error("Error initializing admin:", error);
        process.exit(1);
    }
}

initializeAdmin();
