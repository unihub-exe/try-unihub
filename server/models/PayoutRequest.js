const mongoose = require("mongoose");

const payoutRequestSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    accountDetails: {
        bankName: String,
        accountNumber: String,
        accountName: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date,
        default: null
    },
    processedBy: {
        type: String, // Admin ID
        default: null
    },
    adminNotes: {
        type: String,
        default: ''
    },
    paystackReference: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model("PayoutRequest", payoutRequestSchema);
