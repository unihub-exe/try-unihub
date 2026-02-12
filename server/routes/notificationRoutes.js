const express = require("express");
const router = express.Router();
const { subscribe, testNotification } = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");

// Protected routes
router.post("/subscribe", authenticate, subscribe);
router.post("/test", authenticate, testNotification);

module.exports = router;
