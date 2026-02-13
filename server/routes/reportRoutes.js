const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const {
    createReport,
    getAllReports,
    takeAction,
    deleteReport
} = require("../controllers/reportController");

// Public/User routes
router.post("/create", authenticate, createReport);

// Admin routes
router.get("/all", authenticate, requireRole("ADMIN"), getAllReports);
router.post("/action", authenticate, requireRole("ADMIN"), takeAction);
router.delete("/:reportId", authenticate, requireRole("ADMIN"), deleteReport);

module.exports = router;
