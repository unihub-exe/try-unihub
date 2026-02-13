const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require("../controllers/notificationController");

router.post("/", authenticate, getUserNotifications);
router.patch("/:notificationId/read", authenticate, markAsRead);
router.patch("/read-all", authenticate, markAllAsRead);
router.delete("/:notificationId", authenticate, deleteNotification);

module.exports = router;
