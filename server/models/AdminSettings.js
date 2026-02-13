const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema({
    premiumPricePerDay: {
        type: Number,
        default: 100,
        required: true
    },
    payoutProcessingHours: {
        type: Number,
        default: 48,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure only one settings document exists
adminSettingsSchema.index({}, { unique: true });

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);
