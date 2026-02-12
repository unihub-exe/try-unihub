const Admin = require("../models/admin");
const User = require("../models/user");
const Announcement = require("../models/announcement");
const { Event } = require("../models/event");
const { sendAnnouncementEmail } = require("../utils/emailService");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const JWT_SECRET = process.env.JWT_SECRET;

const setAdmin = async (req, res) => {
    const secret = JWT_SECRET;
    const payload = {
        email: req.body.email,
    };

    const token = await jwt.sign(payload, secret);

    const new_admin = new Admin({
        admin_id: token,
        email: req.body.email,
        name: req.body.name,
        pass: req.body.password,
    });

    try {
        await new_admin.save();
        console.log("Saved::New Admin::credentials.");
    } catch (error) {
        console.log(error);
    }

    res.status(200).send({ msg: "Credentials Added" });
};

const adminAuth = async (req, res) => {
    const Email = req.body.email;
    const Pass = req.body.password;

    try {
        const docs = await Admin.find({ email: Email });
        if (docs.length === 0) {
            return res.status(400).send({ msg: "Admin access denied" });
        } else if (Pass === docs[0].pass) {
            res.status(200).send({
                msg: "Success",
                admin_token: docs[0].admin_id,
            });
        } else {
            return res.status(400).send({ msg: "Email or Password is wrong" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ msg: "Internal Server Error" });
    }
};

const adminDetails = async (req, res) => {
    const admin_token = req.body.admin_id;

    try {
        const docs = await Admin.find({ admin_id: admin_token });
        if (docs.length > 0) {
            res.status(200).send(docs[0]);
        } else {
            res.status(400).send({ msg: "No such admin exists" });
        }
    } catch (err) {
        console.log(err);
        res.status(400).send({ msg: "Error fetching admin" });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, "username email reg_number contactNumber role createdAt");
        res.status(200).send(users);
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Error fetching users" });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);

        if (global.io) {
            global.io.emit("user_deleted", { userId: id });
        }

        res.status(200).send({ msg: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Error deleting user" });
    }
};

const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({}).sort({ createdAt: -1 });
        res.status(200).send(events);
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Error fetching events" });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await Event.findOneAndDelete({ event_id: id });
        
        // Also remove from Admin's eventCreated array if it exists there
        // This is a bit inefficient but ensures consistency if the old logic persists
        await Admin.updateMany(
            {}, 
            { $pull: { eventCreated: { event_id: id } } }
        );

        if (global.io) {
            global.io.emit("event_deleted", { eventId: id });
        }

        res.status(200).send({ msg: "Event deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Error deleting event" });
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const { title, message, admin_id, sendEmail } = req.body;
        
        // specific admin check
        const admin = await Admin.findOne({ admin_id });
        if (!admin) {
            return res.status(401).send({ msg: "Unauthorized" });
        }

        const newAnnouncement = new Announcement({
            title,
            message,
            createdBy: admin.name || "Admin",
        });

        await newAnnouncement.save();

        if (sendEmail) {
            const users = await User.find({}, 'email');
            const emails = users.map(u => u.email).filter(e => e);
            if (emails.length > 0) {
                await sendAnnouncementEmail(emails, title, message);
            }
        }

        if (global.io) {
            global.io.emit("announcement_created", newAnnouncement);
        }

        res.status(201).send({ msg: "Announcement created successfully", announcement: newAnnouncement });
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Error creating announcement" });
    }
};

const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.status(200).send(announcements);
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Error fetching announcements" });
    }
};

const getSystemStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments({});
        
        // Count active events (events with date >= today)
        // Note: Date string format in DB might be inconsistent, but assuming 'date' field is usable or we count all visibility: public
        // For robustness, let's just count all public events for now, or try to filter by date if stored as Date object
        // Based on other controllers, date seems to be a string sometimes. 
        // Let's count all non-private events for "Active Events" or maybe just total events.
        const eventCount = await Event.countDocuments({ visibility: { $ne: "private" } });

        // Count tickets (participants across all events)
        const events = await Event.find({}, 'participants');
        const ticketCount = events.reduce((acc, event) => acc + (event.participants ? event.participants.length : 0), 0);

        res.status(200).send({
            users: userCount,
            events: eventCount,
            tickets: ticketCount
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).send({ msg: "Error fetching system stats" });
    }
};

const getTestimonials = async (req, res) => {
    try {
        const events = await Event.find({ "feedback.0": { $exists: true } }, 'feedback');
        let allFeedback = [];
        events.forEach(event => {
            if (event.feedback && Array.isArray(event.feedback)) {
                event.feedback.forEach(fb => {
                    if (fb.rating >= 4 && fb.comment && fb.comment.length > 10) {
                        allFeedback.push(fb);
                    }
                });
            }
        });

        // Sort by timestamp desc
        allFeedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Take top 3
        const topFeedback = allFeedback.slice(0, 3);
        
        // Enrich with user names
        const enriched = await Promise.all(topFeedback.map(async (fb) => {
            const user = await User.findOne({ user_token: fb.userId });
            return {
                n: user ? (user.displayName || user.username || "Verified Student") : "Verified Student",
                q: fb.comment,
                r: fb.rating,
                u: user ? "Student" : "Guest"
            };
        }));
        
        res.status(200).send(enriched);
    } catch (error) {
        console.error("Error fetching testimonials:", error);
        res.status(500).send({ msg: "Error fetching testimonials" });
    }
};

module.exports = {
    setAdmin,
    adminAuth,
    adminDetails,
    getAllUsers,
    deleteUser,
    getAllEvents,
    deleteEvent,
    createAnnouncement,
    getAnnouncements,
    getSystemStats,
    getTestimonials,
};
