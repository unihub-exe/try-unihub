const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        event_id: {
            type: String,
            requird: true,
        },
        name: {
            type: String,
        },
        venue: {
            type: String,
        },
        date: {
            type: String,
        },
        time: {
            type: String,
        },
        description: {
            type: String,
        },
        price: {
            type: Number,
        },
        cover: {
            type: String,
            default:
                "https://eventplanning24x7.files.wordpress.com/2018/04/events.png",
        },
        profile: {
            type: String,
            default:
                "https://i.etsystatic.com/15907303/r/il/c8acad/1940223106/il_794xN.1940223106_9tfg.jpg",
        },
        organizer: {
            type: String,
        },
        category: {
            type: String,
        },
        address: {
            type: String,
        },
        lat: {
            type: Number,
        },
        lng: {
            type: Number,
        },
        capacity: {
            type: Number,
            default: 0,
        },
        ownerId: {
            type: String,
        },
        participants: [],
        ticketTypes: [
            {
                name: { type: String, required: true },
                price: { type: Number, default: 0 },
                description: { type: String },
                capacity: { type: Number },
                sold: { type: Number, default: 0 },
            },
        ],
        registrationQuestions: [
            {
                label: { type: String, required: true },
                type: { type: String, default: "text" },
                required: { type: Boolean, default: false },
                options: [String],
            },
        ],
        visibility: {
            type: String,
            enum: ["public", "private", "members_only"],
            default: "public",
        },
        requiresApproval: {
            type: Boolean,
            default: false,
        },
        waitlistEnabled: {
            type: Boolean,
            default: false,
        },
        isPremium: {
            type: Boolean,
            default: false,
        },
        waitlist: [
            {
                userId: { type: String },
                name: { type: String },
                email: { type: String },
                date: { type: Date, default: Date.now },
            },
        ],
        pendingParticipants: [
            {
                userId: { type: String },
                name: { type: String },
                email: { type: String },
                date: { type: Date, default: Date.now },
                answers: [], // Store answers here too
                ticketType: { type: String },
                paymentInfo: {}, // If needed
            },
        ],
        hideLocation: {
            type: Boolean,
            default: false,
        },
        registrationToken: {
            type: String,
            default: "",
        },
        remindersSent: {
            week: { type: Boolean, default: false },
            threeDays: { type: Boolean, default: false },
            day: { type: Boolean, default: false },
            hour: { type: Boolean, default: false },
            followUp: { type: Boolean, default: false },
        },
        feedback: [
            {
                userId: { type: String },
                rating: { type: Number, required: true },
                comment: { type: String },
                timestamp: { type: Date, default: Date.now },
            }
        ],
        views: { type: Number, default: 0 },
        analytics: {
            referrals: { type: Map, of: Number, default: {} },
        },
    },
    { timestamps: true }
);



const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

module.exports = {
    Event,
    eventSchema,
};
