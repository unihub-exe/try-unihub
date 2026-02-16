const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const readline = require("readline");
const Admin = require("./models/admin");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGO_ATLAS_URI || process.env.MONGODB_URI;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function addAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB\n");

        // Get admin details
        const email = await question("Enter admin email: ");
        const name = await question("Enter admin name: ");
        const password = await question("Enter admin password: ");

        // Validate inputs
        if (!email || !name || !password) {
            console.log("❌ All fields are required!");
            process.exit(1);
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log(`\n❌ Admin with email ${email} already exists.`);
            process.exit(1);
        }

        // Create JWT token
        const payload = { email };
        const token = jwt.sign(payload, JWT_SECRET);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin
        const newAdmin = new Admin({
            admin_id: token,
            email,
            name,
            pass: hashedPassword,
        });

        await newAdmin.save();
        console.log("\n✅ Admin account created successfully!");
        console.log(`Email: ${email}`);
        console.log(`Name: ${name}`);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error adding admin:", error);
        process.exit(1);
    }
}

addAdmin();
