const User = require("../models/user");
const Announcement = require("../models/announcement");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const userDetails = async(req, res) => {
    const user_id = req.body.user_token;
    try {
        const docs = await User.find({ user_token: user_id });
        if (docs.length > 0) {
            res.status(200).send(docs[0]);
        } else {
            res.status(404).send({ msg: "User not found" });
        }
    } catch (err) {
        console.log(err);
        res.status(400).send({ msg: "Error fetching user" });
    }
};

const updateProfile = async(req, res) => {
    const user_id = req.body.user_token;
    const payload = req.body.profile || {};
    const allowed = [
        "avatar",
        "displayName",
        "bio",
        "location",
        "interests",
        "timezone",
        "publicProfile",
        "hideStats",
        "socialLinks",
        "countryCode",
        "phoneNumber",
        "university",
        "levelOfStudy",
        "department",
    ];
    const toSet = {};
    for (const key of allowed) {
        if (payload[key] !== undefined) toSet[key] = payload[key];
    }
    try {
        await User.updateOne({ user_token: user_id }, { $set: toSet });
        res.status(200).send({ msg: "Profile updated" });
    } catch (e) {
        console.log(e);
        res.status(400).send({ msg: "Error updating profile" });
    }
};

const switchRole = async(req, res) => {
    const user_id = req.body.user_token;
    const { targetRole } = req.body;

    try {
        const user = await User.findOne({ user_token: user_id });
        if (!user) return res.status(404).send({ msg: "User not found" });

        if (user.role === "ADMIN") {
            return res.status(403).send({ msg: "Admins cannot switch roles" });
        }

        if (targetRole && !["ORGANIZER", "ATTENDEE"].includes(targetRole)) {
            return res.status(400).send({ msg: "Invalid role" });
        }

        // If no targetRole provided, toggle
        const newRole = targetRole || (user.role === "ATTENDEE" ? "ORGANIZER" : "ATTENDEE");

        if (user.role === newRole) {
            return res.status(200).send({ msg: `You are already an ${newRole.toLowerCase()}` });
        }

        user.role = newRole;
        await user.save();

        const token = jwt.sign({ user_token: user.user_token, role: user.role },
            JWT_SECRET, { expiresIn: "15m" }
        );

        res.status(200).send({ msg: "Role updated successfully", role: user.role, accessToken: token });
    } catch (e) {
        console.error(e);
        res.status(500).send({ msg: "Error switching role" });
    }
};

const getAnnouncements = async(req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.status(200).send(announcements);
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Error fetching announcements" });
    }
};

module.exports = {
    userDetails,
    updateProfile,
    getAnnouncements,
    switchRole
};