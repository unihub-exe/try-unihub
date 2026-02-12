const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        createdBy: {
            type: String, // Admin ID or Name
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);
