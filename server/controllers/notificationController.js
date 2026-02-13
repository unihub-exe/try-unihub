const Notification = require("../models/Notification");

// Get user notifications
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.body.user_token || req.user?.user_token;
        
        if (!userId) {
            return res.status(401).send({ msg: "Unauthorized" });
        }

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ userId, read: false });

        res.send({ notifications, unreadCount });
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        await Notification.updateOne(
            { _id: notificationId },
            { read: true }
        );

        res.send({ msg: "Notification marked as read" });
    } catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.body.user_token || req.user?.user_token;
        
        await Notification.updateMany(
            { userId, read: false },
            { read: true }
        );

        res.send({ msg: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all as read error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        await Notification.deleteOne({ _id: notificationId });

        res.send({ msg: "Notification deleted" });
    } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

// Create notification (internal use)
exports.createNotification = async (userId, type, title, message, link = null, metadata = {}) => {
    try {
        await Notification.create({
            userId,
            type,
            title,
            message,
            link,
            metadata
        });
    } catch (error) {
        console.error("Create notification error:", error);
    }
};

module.exports = exports;
