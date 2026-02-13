const express = require("express");
const router = express.Router();
const { searchUsers, getPublicProfile, followUser, unfollowUser, getFollowersList } = require("../controllers/userInteractionController");
const { authenticate } = require("../middleware/auth");

router.get("/social/search", searchUsers);
router.get("/social/profile/:id", getPublicProfile);
router.post("/social/follow", authenticate, followUser);
router.post("/social/unfollow", authenticate, unfollowUser);
router.get("/social/followers/:id", getFollowersList);

module.exports = router;
