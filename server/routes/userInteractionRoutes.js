const express = require("express");
const router = express.Router();
const { searchUsers, getPublicProfile, followUser, unfollowUser, getFollowersList } = require("../controllers/userInteractionController");
const { authenticate } = require("../middleware/auth");

router.get("/search", searchUsers);
router.get("/profile/:id", getPublicProfile);
router.post("/follow", authenticate, followUser);
router.post("/unfollow", authenticate, unfollowUser);
router.get("/followers/:id", getFollowersList);

module.exports = router;
