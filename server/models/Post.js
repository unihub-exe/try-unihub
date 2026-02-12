const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    authorId: {
        type: String,
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    authorType: {
        type: String,
        enum: ['User', 'Admin'],
        required: true
    },
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    parentPostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },
    image: {
        type: String, // URL to image
        default: null
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    likes: [{
        type: String // User/Admin IDs
    }],
    dislikes: [{
        type: String // User/Admin IDs
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Post", postSchema);
