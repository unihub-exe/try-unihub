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
router.route("/details").post(adminDetails);
// router.route("/mail/test").post(sendTestMailHandler); // TODO: Implement sendTestMailHandler
router.route("/users").get(getAllUsers);
router.route("/users/:id").delete(deleteUser);
router.route("/events").get(getAllEvents);
router.route("/events/:id").delete(deleteEvent);
router.route("/announcements").get(getAnnouncements).post(createAnnouncement);
router.route("/stats").get(getSystemStats);
router.route("/testimonials").get(getTestimonials);

// Settings routes
router.route("/settings").get(getSettings).post(authenticate, requireRole("ADMIN"), updateSettings);

// Payout management routes
router.route("/payouts").get(authenticate, requireRole("ADMIN"), getAllPayouts);
router.route("/payout/approve").post(authenticate, requireRole("ADMIN"), approvePayout);
router.route("/payout/reject").post(authenticate, requireRole("ADMIN"), rejectPayout);

module.exports = router;
