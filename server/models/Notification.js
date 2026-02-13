const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'ticket_purchase',
            'ticket_sale',
            'community_tag',
            'community_event',
            'report_reviewed',
            'account_suspended',
            'account_deleted',
            'payout_approved',
            'payout_rejected',
            'event_cancelled',
            'refund_processed',
            'follow',
            'general'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Notification", notificationSchema);
