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

module.exports = router;
