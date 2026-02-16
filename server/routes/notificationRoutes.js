const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require("../controllers/notificationController");

// User notifications (accepts token in body for compatibility)
router.post("/user", getUserNotifications);
router.post("/", authenticate, getUserNotifications);
router.patch("/:notificationId/read", authenticate, markAsRead);
router.patch("/read-all", authenticate, markAllAsRead);
router.delete("/:notificationId", authenticate, deleteNotification);

module.exports = router;
