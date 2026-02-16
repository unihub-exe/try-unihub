const express = require("express");
const router = express.Router();
const {
    setAdmin,
    adminAuth,
    adminDetails,
    getAllUsers,
    deleteUser,
    getAllEvents,
    deleteEvent,
    createAnnouncement,
    getAnnouncements,
    getSystemStats,
    getTestimonials,
} = require("../controllers/adminController");
const { getSettings, updateSettings } = require("../controllers/adminSettingsController");
const { getAllPayouts, approvePayout, rejectPayout } = require("../controllers/adminPayoutController");
const { authenticate, requireRole } = require("../middleware/auth");
// const { sendTestMailHandler } = require("../controllers/smsController");

router.route("/setadmin").post(setAdmin);
router.route("/auth").post(adminAuth);
router.route("/details").post(authenticate, requireRole("ADMIN"), adminDetails);
// router.route("/mail/test").post(sendTestMailHandler); // TODO: Implement sendTestMailHandler
router.route("/users").get(authenticate, requireRole("ADMIN"), getAllUsers);
router.route("/users/:id").delete(authenticate, requireRole("ADMIN"), deleteUser);
router.route("/events").get(authenticate, requireRole("ADMIN"), getAllEvents);
router.route("/events/:id").delete(authenticate, requireRole("ADMIN"), deleteEvent);
router.route("/announcements")
    .get(authenticate, requireRole("ADMIN"), getAnnouncements)
    .post(authenticate, requireRole("ADMIN"), createAnnouncement);
router.route("/stats").get(authenticate, requireRole("ADMIN"), getSystemStats);
router.route("/testimonials").get(authenticate, requireRole("ADMIN"), getTestimonials);

// Settings routes
router.route("/settings")
    .get(authenticate, requireRole("ADMIN"), getSettings)
    .post(authenticate, requireRole("ADMIN"), updateSettings);

// Payout management routes
router.route("/payouts").get(authenticate, requireRole("ADMIN"), getAllPayouts);
router.route("/payout/approve").post(authenticate, requireRole("ADMIN"), approvePayout);
router.route("/payout/reject").post(authenticate, requireRole("ADMIN"), rejectPayout);

module.exports = router;
