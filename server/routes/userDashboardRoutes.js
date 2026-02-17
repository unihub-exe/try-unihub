const express = require("express");
const router = express.Router();
const { userDetails, updateProfile, switchRole, getAnnouncements } = require("../controllers/userDashboard");
const { authenticate } = require("../middleware/auth");

router.route("/details").post(authenticate, userDetails);
router.route("/update").post(authenticate, updateProfile);
router.route("/switch-role").post(authenticate, switchRole);

// Announcements route with explicit CORS handling
router.route("/announcements")
    .options((req, res) => {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.sendStatus(200);
    })
    .get(getAnnouncements);

module.exports = router;
