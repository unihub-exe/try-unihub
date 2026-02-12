const express = require("express");
const router = express.Router();
const {
  createCommunity,
  getAllCommunities,
  joinCommunity,
  leaveCommunity,
  getUserCommunities,
  getCommunityDetails,
  deleteCommunity,
  createPost,
  getCommunityPosts,
  likePost,
  dislikePost,
  deletePost,
  pinPost,
  updateMemberRole,
  removeMember,
  getCommunityUniversityStats
} = require("../controllers/communityController");
const { authenticate } = require("../middleware/auth");

router.post("/create", authenticate, createCommunity);
router.get("/all", getAllCommunities);
router.get("/user/:id", getUserCommunities);
router.post("/join/:id", authenticate, joinCommunity);
router.post("/leave/:id", authenticate, leaveCommunity);
router.post("/member/role/:id", authenticate, updateMemberRole);
router.post("/member/remove/:id", authenticate, removeMember);
router.get("/details/:id", getCommunityDetails);
router.delete("/:id", authenticate, deleteCommunity);
router.post("/post/create", authenticate, createPost);
router.get("/posts/:id", getCommunityPosts);
router.post("/post/like", authenticate, likePost);
router.post("/post/dislike", authenticate, dislikePost);
router.post("/post/delete", authenticate, deletePost);
router.post("/post/pin", authenticate, pinPost);
router.get("/stats/universities/:id", getCommunityUniversityStats);

module.exports = router;
