const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { authenticate } = require("../middleware/auth");

router.post("/create", eventController.postEvent);
router.post("/post/event", eventController.postEvent); // Alias for client

router.get("/all", eventController.allEvents);
router.get("/getallevents", eventController.allEvents); // Alias

router.post("/particular", eventController.particularEvent);
router.post("/getevent", eventController.particularEvent); // Alias for client

router.post("/delete", eventController.deleteEvent);
router.post("/cancel", eventController.cancelEvent);

router.post("/checkin", eventController.checkin);
router.post("/event/checkin", eventController.checkin); // Alias

router.post("/update", eventController.updateEvent);
router.post("/event/update", eventController.updateEvent); // Alias

router.post("/duplicate", authenticate, eventController.duplicateEvent);
router.post("/event/duplicate", authenticate, eventController.duplicateEvent); // Alias

router.post("/manage-participant", authenticate, eventController.manageParticipant);
router.post("/event/manage-participant", authenticate, eventController.manageParticipant); // Alias

router.post("/my-events", authenticate, eventController.getMyEvents);
router.post("/user-events", eventController.getUserEvents);
router.post("/event/export-guests", eventController.exportGuests);
router.post("/feedback", eventController.submitFeedback);
router.get("/wallet", require("../controllers/walletController").generatePass);

module.exports = router;
