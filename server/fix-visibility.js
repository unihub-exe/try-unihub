const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, ".env") });

const { Event } = require("./models/event");

async function fixVisibility() {
    try {
        // Use MONGO_ATLAS_URI from your .env file
        const mongoUri = process.env.MONGO_ATLAS_URI || process.env.MONGO_URI;
        
        if (!mongoUri) {
            console.error("Error: MONGO_ATLAS_URI not found in .env file");
            process.exit(1);
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB");

        // Find events without visibility field
        const eventsWithoutVisibility = await Event.countDocuments({ 
            visibility: { $exists: false } 
        });
        
        console.log(`Found ${eventsWithoutVisibility} events without visibility field`);

        if (eventsWithoutVisibility === 0) {
            console.log("✅ All events already have visibility field!");
            process.exit(0);
        }

        // Update events
        const result = await Event.updateMany(
            { visibility: { $exists: false } },
            { $set: { visibility: "public" } }
        );

        console.log(`✅ Updated ${result.modifiedCount} events to public visibility`);
        
        // Verify
        const publicEvents = await Event.countDocuments({ visibility: "public" });
        const privateEvents = await Event.countDocuments({ visibility: "private" });
        const totalEvents = await Event.countDocuments({});
        
        console.log("\n📊 Event Visibility Summary:");
        console.log(`   Total events: ${totalEvents}`);
        console.log(`   Public events: ${publicEvents}`);
        console.log(`   Private events: ${privateEvents}`);
        
        await mongoose.connection.close();
        console.log("\n✅ Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

fixVisibility();