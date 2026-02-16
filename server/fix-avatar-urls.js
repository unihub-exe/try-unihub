/**
 * Migration script to fix avatar URLs that point to /uploads/ instead of Cloudinary
 * Run this once to clean up old data
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");

const MONGO_URI = process.env.MONGO_ATLAS_URI || process.env.MONGO_URI || "mongodb://localhost:27017/unihub";

async function fixAvatarUrls() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Find all users with avatar URLs containing /uploads/
        const usersWithLocalAvatars = await User.find({
            avatar: { $regex: /\/uploads\// }
        });

        console.log(`Found ${usersWithLocalAvatars.length} users with local avatar URLs`);

        let fixed = 0;
        let failed = 0;

        for (const user of usersWithLocalAvatars) {
            try {
                console.log(`Fixing avatar for user: ${user.username || user.email}`);
                console.log(`  Old URL: ${user.avatar}`);
                
                // Option 1: Clear the avatar (user will need to re-upload)
                user.avatar = "";
                await user.save();
                
                console.log(`  Cleared avatar - user will need to re-upload`);
                fixed++;
            } catch (error) {
                console.error(`  Failed to fix user ${user.username}:`, error.message);
                failed++;
            }
        }

        console.log("\n=== Migration Complete ===");
        console.log(`Fixed: ${fixed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Total: ${usersWithLocalAvatars.length}`);

        await mongoose.connection.close();
        console.log("Database connection closed");
        process.exit(0);
    } catch (error) {
        console.error("Migration error:", error);
        process.exit(1);
    }
}

// Run the migration
fixAvatarUrls();
