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
const { sendTestMailHandler } = require("../controllers/smsController");

router.route("/setadmin").post(setAdmin);
router.route("/admin/auth").post(adminAuth);
router.route("/admin/details").post(adminDetails);
router.route("/admin/mail/test").post(sendTestMailHandler);
router.route("/admin/users").get(getAllUsers);
router.route("/admin/users/:id").delete(deleteUser);
router.route("/admin/events").get(getAllEvents);
router.route("/admin/events/:id").delete(deleteEvent);
router.route("/admin/announcements").get(getAnnouncements).post(createAnnouncement);
router.route("/admin/stats").get(getSystemStats);
router.route("/admin/testimonials").get(getTestimonials);

module.exports = router;
