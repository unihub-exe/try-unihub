const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    reason: {
        type: String,
        required: true
    },
    blacklistedBy: {
        type: String, // Admin ID
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Blacklist", blacklistSchema);
