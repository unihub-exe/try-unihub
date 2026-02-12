const User = require("../models/user");

// Search users by username or displayName
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.send([]);

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { displayName: { $regex: query, $options: "i" } },
      ],
    }).select("username displayName avatar role bio");

    res.send(users);
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Server error" });
  }
};

// Get public profile of a user
exports.getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params; // Can be _id or username
    let user;

    // Check if valid ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(id).select("-passwordHash -user_token -refreshToken -emailVerificationToken -wallet");
    } else {
        user = await User.findOne({ username: id }).select("-passwordHash -user_token -refreshToken -emailVerificationToken -wallet");
    }

    if (!user) return res.status(404).send({ msg: "User not found" });

    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Server error" });
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const { targetUserId } = req.body; // _id of user to follow
    const currentUserToken = req.user.user_token;

    const currentUser = await User.findOne({ user_token: currentUserToken });
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).send({ msg: "User not found" });
    }

    if (currentUser._id.equals(targetUser._id)) {
      return res.status(400).send({ msg: "Cannot follow yourself" });
    }

    // Check if already following
    if (currentUser.following.includes(targetUser._id)) {
      return res.status(400).send({ msg: "Already following" });
    }

    currentUser.following.push(targetUser._id);
    targetUser.followersCount += 1;

    // If targetUser is already following currentUser, mark both as friends
    const targetFollowsCurrent = targetUser.following.some(id => id.equals(currentUser._id));
    if (targetFollowsCurrent) {
      if (!currentUser.friends.some(id => id.equals(targetUser._id))) {
        currentUser.friends.push(targetUser._id);
      }
      if (!targetUser.friends.some(id => id.equals(currentUser._id))) {
        targetUser.friends.push(currentUser._id);
      }
    }

    await currentUser.save();
    await targetUser.save();

    res.send({ msg: "Followed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Server error" });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserToken = req.user.user_token;

    const currentUser = await User.findOne({ user_token: currentUserToken });
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).send({ msg: "User not found" });
    }

    // Remove from following
    currentUser.following = currentUser.following.filter(id => !id.equals(targetUser._id));
    
    // Decrement followers count
    targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);

    // Remove from friends if they were friends
    currentUser.friends = currentUser.friends.filter(id => !id.equals(targetUser._id));
    targetUser.friends = targetUser.friends.filter(id => !id.equals(currentUser._id));

    await currentUser.save();
    await targetUser.save();

    res.send({ msg: "Unfollowed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Server error" });
  }
};

// Followers list for a user
exports.getFollowersList = async (req, res) => {
  try {
    const { id } = req.params; // user _id
    if (!id) return res.status(400).send({ msg: "Missing user id" });
    const followers = await User.find({ following: id })
      .select("_id username displayName avatar role bio");
    res.send(followers);
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Server error" });
  }
};
