const mongoose = require("mongoose");
const { eventSchema } = require("./event");

const userSchema = new mongoose.Schema({
    user_token: {
        type: String,
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
    },
    role: {
        type: String,
        enum: ["ATTENDEE", "ORGANIZER", "ADMIN"],
        default: "ATTENDEE",
        index: true,
    },
    emailVerified: {
        type: Boolean,
        default: false,
        index: true,
    },
    organizationId: {
        type: String,
    },
    reg_number: {
        type: String,
        trim: true,
        required: false,
    },
    username: {
        type: String,
        trim: true,
        unique: true,
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
    },
    contactNumber: {
        type: String,
        required: false,
    },
    countryCode: {
        type: String,
        trim: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    avatar: {
        type: String,
    },
    displayName: {
        type: String,
    },
    bio: {
        type: String,
    },
    location: {
        type: String,
    },
    university: {
        type: String,
        trim: true,
    },
    levelOfStudy: {
        type: String,
    },
    department: {
        type: String,
        trim: true,
    },
    interests: {
        type: [String],
        default: [],
    },
    timezone: {
        type: String,
    },
    publicProfile: {
        type: Boolean,
        default: true,
    },
    hideStats: {
        type: Boolean,
        default: false,
    },
    followersCount: {
        type: Number,
        default: 0,
    },
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    communitiesCreated: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
    }],
    socialLinks: {
        type: [String],
        default: [],
    },
    wallet: {
        availableBalance: { type: Number, default: 0 },
        pendingBalance: { type: Number, default: 0 },
        payout: {
            minimumThreshold: { type: Number, default: 0 },
            autoPayout: { type: Boolean, default: false },
            status: {
                type: String,
                enum: ["pending", "processing", "completed", "failed"],
                default: "pending",
            },
        },
    },
    refreshToken: {
        token: { type: String },
        expiresAt: { type: Date },
    },
    emailVerificationToken: {
        type: String,
    },
    emailVerificationExpires: {
        type: Date,
    },
    registeredEvents: [eventSchema],
    eventCreated: [eventSchema],
    pushSubscriptions: [{
        endpoint: { type: String, required: true },
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true },
        },
    }],
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);