const Community = require("../models/Community");
const Post = require("../models/Post");
const User = require("../models/user");

// Aggregate top universities of community members (max 5)
exports.getCommunityUniversityStats = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await Community.findById(id).select("members");
    if (!community) return res.status(404).send({ msg: "Community not found" });
    const memberIds = community.members || [];
    if (memberIds.length === 0) return res.send([]);
    const stats = await User.aggregate([
      { $match: { _id: { $in: memberIds }, university: { $exists: true, $ne: "" } } },
      { $group: { _id: "$university", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.send(stats.map(s => ({ university: s._id, count: s.count })));
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Server error" });
  }
};
exports.createCommunity = async (req, res) => {
  try {
    const { name, description, isPrivate, profileImage, rules } = req.body;
    const userId = req.user.user_token; // Assumes user is authenticated and token is in req.user
    
    // Find user to check role and limits (using user_token as ID reference based on auth middleware)
    // Actually auth middleware puts payload in req.user. payload has user_token.
    // We need the _id to link in mongoose.
    const user = await User.findOne({ user_token: userId });
    
    if (!user) {
      return res.status(404).send({ msg: "User not found" });
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return res.status(403).send({ msg: "Only organizations can create communities" });
    }

    if (user.communitiesCreated && user.communitiesCreated.length >= 2) {
      return res.status(400).send({ msg: "You can only create up to 2 communities" });
    }

    const newCommunity = await Community.create({
      name,
      description,
      isPrivate,
      profileImage,
      rules: rules || [],
      creator: user._id,
      members: [user._id], // Creator is automatically a member
      roles: [{ user: user._id, role: "admin" }],
    });

    // Update user
    user.communitiesCreated.push(newCommunity._id);
    await user.save();

    res.status(201).send({ msg: "Community created", community: newCommunity });
  } catch (error) {
    console.error("Create Community Error:", error);
    if (error.code === 11000) {
      return res.status(400).send({ msg: "Community name already exists" });
    }
    res.status(500).send({ msg: "Server error" });
  }
};

exports.getCommunityDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await Community.findById(id)
        .populate("creator", "username displayName avatar")
        .populate("roles.user", "username displayName avatar"); // Populate roles with user details
    if (!community) return res.status(404).send({ msg: "Community not found" });
    res.send(community);
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Server error" });
  }
};

exports.deleteCommunity = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_token;
        const user = await User.findOne({ user_token: userId });
        
        const community = await Community.findById(id);
        if (!community) return res.status(404).send({ msg: "Community not found" });
        
        if (community.creator.toString() !== user._id.toString() && user.role !== 'ADMIN') {
            return res.status(403).send({ msg: "Not authorized" });
        }
        
        await Post.deleteMany({ communityId: id });
        await Community.findByIdAndDelete(id);
        
        user.communitiesCreated = user.communitiesCreated.filter(c => c.toString() !== id);
        await user.save();
        
        res.send({ msg: "Community deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
};

exports.createPost = async (req, res) => {
    try {
        const { content, communityId, authorId, authorType, authorName, image, authorAvatar } = req.body;
        
        const newPost = await Post.create({
            content,
            communityId,
            authorId,
            authorType,
            authorName,
            authorAvatar,
            image
        });
        
        if (global.io) {
            global.io.emit("new_post", newPost);
        }
        
        res.status(201).send(newPost);
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
};

exports.getCommunityPosts = async (req, res) => {
    try {
        const { id } = req.params;
        const posts = await Post.find({ communityId: id, parentPostId: null }).sort({ isPinned: -1, createdAt: -1 });
        res.send(posts);
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
};

exports.likePost = async (req, res) => {
    try {
        const { postId, userId } = req.body;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).send({ msg: "Post not found" });
        
        if (post.dislikes.includes(userId)) {
            post.dislikes = post.dislikes.filter(id => id !== userId);
        }

        if (post.likes.includes(userId)) {
            post.likes = post.likes.filter(id => id !== userId);
        } else {
            post.likes.push(userId);
        }
        
        await post.save();
        res.send(post);
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
};

exports.dislikePost = async (req, res) => {
    try {
        const { postId, userId } = req.body;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).send({ msg: "Post not found" });

        if (post.likes.includes(userId)) {
            post.likes = post.likes.filter(id => id !== userId);
        }

        if (post.dislikes.includes(userId)) {
            post.dislikes = post.dislikes.filter(id => id !== userId);
        } else {
            post.dislikes.push(userId);
        }
        
        await post.save();
        res.send(post);
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user.user_token;
        const user = await User.findOne({ user_token: userId });
        
        const post = await Post.findById(postId);
        if (!post) return res.status(404).send({ msg: "Post not found" });
        
        const community = await Community.findById(post.communityId);
        
        const isAuthor = post.authorId === userId || post.authorId === user._id.toString();
        const isAdmin = community.creator.toString() === user._id.toString() || user.role === 'ADMIN';
        
        if (!isAuthor && !isAdmin) {
            return res.status(403).send({ msg: "Not authorized" });
        }
        
        await Post.findByIdAndDelete(postId);
        res.send({ msg: "Post deleted", postId });
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
};

exports.pinPost = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user.user_token;
        const user = await User.findOne({ user_token: userId });
        
        const post = await Post.findById(postId);
        if (!post) return res.status(404).send({ msg: "Post not found" });
        
        const community = await Community.findById(post.communityId);
        
        if (community.creator.toString() !== user._id.toString() && user.role !== 'ADMIN') {
            return res.status(403).send({ msg: "Only admins can pin posts" });
        }
        
        await Post.updateMany({ communityId: community._id }, { isPinned: false });
        
        post.isPinned = true;
        await post.save();
        
        res.send(post);
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
};

exports.joinCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_token;
    
    const user = await User.findOne({ user_token: userId });
    if (!user) return res.status(404).send({ msg: "User not found" });

    const community = await Community.findById(id);
    if (!community) return res.status(404).send({ msg: "Community not found" });

    if (community.members.includes(user._id)) {
      return res.status(400).send({ msg: "Already a member" });
    }

    community.members.push(user._id);
    community.roles.push({ user: user._id, role: "member" }); // Default role
    await community.save();

    res.send({ msg: "Joined community", community });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Server error" });
  }
};

exports.leaveCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_token;
    
    const user = await User.findOne({ user_token: userId });
    if (!user) return res.status(404).send({ msg: "User not found" });

    const community = await Community.findById(id);
    if (!community) return res.status(404).send({ msg: "Community not found" });

    // Check if creator tries to leave (optional: allow or disallow)
    // For now, let's allow, but maybe warn or transfer ownership? 
    // Keeping it simple: just remove from members.
    
    community.members = community.members.filter(m => m.toString() !== user._id.toString());
    community.roles = community.roles.filter(r => r.user.toString() !== user._id.toString());
    await community.save();

    res.send({ msg: "Left community", community });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Server error" });
  }
};

exports.getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.find()
      .populate("creator", "username displayName avatar");
    res.send(communities);
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Server error" });
  }
};

exports.getUserCommunities = async (req, res) => {
  try {
    const { id } = req.params; // user _id
    const communities = await Community.find({ members: id })
      .populate("creator", "username displayName avatar")
      .select("name description profileImage roles members creator");
    // Attach role of this user to each community
    const withRoles = communities.map(c => {
      const roleObj = (c.roles || []).find(r => r.user.toString() === id);
      return {
        _id: c._id,
        name: c.name,
        description: c.description,
        profileImage: c.profileImage,
        role: roleObj ? roleObj.role : "member",
        creator: c.creator,
      };
    });
    res.send(withRoles);
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Server error" });
  }
};

exports.updateMemberRole = async (req, res) => {
    try {
        const { id } = req.params; // Community ID
        const { targetUserId, newRole } = req.body; // User to update, new role
        const userId = req.user.user_token; // Requesting user (Admin)

        if (!["member", "partner", "admin"].includes(newRole)) {
            return res.status(400).send({ msg: "Invalid role" });
        }

        const user = await User.findOne({ user_token: userId });
        const community = await Community.findById(id);

        if (!community) return res.status(404).send({ msg: "Community not found" });

        // Check if requester is admin/creator
        const requesterRole = community.roles.find(r => r.user.toString() === user._id.toString())?.role;
        const isCreator = community.creator.toString() === user._id.toString();

        if (!isCreator && requesterRole !== "admin") {
            return res.status(403).send({ msg: "Only admins can change roles" });
        }

        // Check if target is in community
        const targetMemberIndex = community.roles.findIndex(r => r.user.toString() === targetUserId);
        if (targetMemberIndex === -1) {
            return res.status(404).send({ msg: "User not in community" });
        }

        // Prevent changing creator's role
        if (community.roles[targetMemberIndex].user.toString() === community.creator.toString()) {
            return res.status(403).send({ msg: "Cannot change creator's role" });
        }

        community.roles[targetMemberIndex].role = newRole;
        await community.save();

        res.send({ msg: "Role updated", community });
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { id } = req.params; // Community ID
        const { targetUserId } = req.body;
        const userId = req.user.user_token; // Requesting user

        const user = await User.findOne({ user_token: userId });
        const community = await Community.findById(id);

        if (!community) return res.status(404).send({ msg: "Community not found" });

        // Check if requester is admin/creator
        const requesterRole = community.roles.find(r => r.user.toString() === user._id.toString())?.role;
        const isCreator = community.creator.toString() === user._id.toString();

        if (!isCreator && requesterRole !== "admin") {
            return res.status(403).send({ msg: "Only admins can remove members" });
        }

        // Prevent removing creator
        if (targetUserId === community.creator.toString()) {
            return res.status(403).send({ msg: "Cannot remove creator" });
        }

        community.members = community.members.filter(m => m.toString() !== targetUserId);
        community.roles = community.roles.filter(r => r.user.toString() !== targetUserId);
        await community.save();

        res.send({ msg: "Member removed", community });
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
};
