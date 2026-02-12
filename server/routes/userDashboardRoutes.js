const express = require("express");
const router = express.Router();
const { userDetails, updateProfile, switchRole, getAnnouncements } = require("../controllers/userDashboard");
const { authenticate } = require("../middleware/auth");

router.route("/details").post(authenticate, userDetails);
router.route("/update").post(authenticate, updateProfile);
router.route("/switch-role").post(authenticate, switchRole);
router.route("/announcements").get(getAnnouncements);

module.exports = router;
