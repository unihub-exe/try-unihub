const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    reportType: {
        type: String,
        enum: ['user', 'event', 'community'],
        required: true
    },
    reportedId: {
        type: String, // ID of the reported entity
        required: true
    },
    reportedName: {
        type: String,
        required: true
    },
    reporterId: {
        type: String,
        required: true
    },
    reporterName: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
        default: 'pending'
    },
    adminAction: {
        type: String,
        enum: ['none', 'suspended', 'deleted', 'dismissed'],
        default: 'none'
    },
    adminNotes: {
        type: String,
        default: ''
    },
    actionTakenBy: {
        type: String, // Admin ID
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model("Report", reportSchema);
