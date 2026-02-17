const { Event } = require("../models/event");
const Admin = require("../models/admin");
const User = require("../models/user");
const dotenv = require("dotenv");
dotenv.config();

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const { sendCheckInEmail } = require("../utils/emailService");

const postEvent = async(req, res) => {
    const Name = req.body.name;
    const Venue = req.body.venue;
    const Date = req.body.date;
    const Time = req.body.time;
    const EndDate = req.body.endDate;
    const EndTime = req.body.endTime;
    const Desc = req.body.description;
    const Price = req.body.price;
    const Profile = req.body.profile;
    const Cover = req.body.cover;
    const Organizer = req.body.organizer;
    const Capacity = req.body.capacity;
    const Address = req.body.address;
    const Lat = req.body.lat;
    const Lng = req.body.lng;
    const Category = req.body.category;
    const TicketTypes = req.body.ticketTypes;
    const RegistrationQuestions = req.body.registrationQuestions;

    // New fields
    const Visibility = req.body.visibility;
    const RequiresApproval = req.body.requiresApproval;
    const WaitlistEnabled = req.body.waitlistEnabled;
    const HideLocation = req.body.hideLocation;
    const RegistrationToken = req.body.registrationToken;
    const IsPremium = req.body.isPremium;

    const adminId = req.body.admin_id;
    const userId = req.body.user_id;
    if (adminId) console.log("Admin ID: ", adminId);
    if (userId) console.log("User ID: ", userId);

    const secret = JWT_SECRET;
    const payload = {
        email: Name,
    };

    const token = await jwt.sign(payload, secret);

    let organizerName = Organizer;
    try {
        if (userId) {
            const userDoc = await User.findOne({ user_token: userId });
            if (userDoc) {
                organizerName = userDoc.displayName || userDoc.username || organizerName;
            }
        } else if (adminId) {
            const adminDoc = await Admin.findOne({ admin_id: adminId });
            if (adminDoc && adminDoc.name) {
                organizerName = adminDoc.name;
            }
        }
    } catch (e) {}

    const new_event = new Event({
        event_id: token,
        name: Name,
        venue: Venue,
        date: Date,
        time: Time,
        endDate: EndDate,
        endTime: EndTime,
        description: Desc,
        price: Price,
        profile: Profile,
        cover: Cover,
        organizer: organizerName,
        category: Category,
        address: Address,
        lat: Lat,
        lng: Lng,
        capacity: Capacity || 0,
        ownerId: adminId || userId,
        ticketTypes: TicketTypes,
        registrationQuestions: RegistrationQuestions,
        visibility: Visibility || "public",
        requiresApproval: RequiresApproval || false,
        waitlistEnabled: WaitlistEnabled || false,
        hideLocation: HideLocation || false,
        isPremium: IsPremium || false,
    });

    try {
        await new_event.save();
        console.log("Saved::New Event::created.");
        if (global.io) global.io.emit("event_created", new_event);

        // Auto-upgrade user to ORGANIZER role if they're creating their first event
        if (userId) {
            const userDoc = await User.findOne({ user_token: userId });
            if (userDoc && userDoc.role === "ATTENDEE") {
                await User.updateOne(
                    { user_token: userId },
                    { $set: { role: "ORGANIZER" } }
                );
                console.log(`User ${userId} upgraded to ORGANIZER role`);
            }
        }

        // Handle Recurring Events
        const repeatFrequency = req.body.repeatFrequency;
        const repeatCount = req.body.repeatCount ? parseInt(req.body.repeatCount) : 0;

        if (repeatFrequency && repeatFrequency !== "none" && repeatCount > 1) {
            const createRecurringEvents = async() => {
                // Parse initial date (assuming DD/MM/YYYY from client)
                const [day, month, year] = Date.split('/').map(Number);
                let currentDate = new Date(year, month - 1, day);

                for (let i = 1; i < repeatCount; i++) {
                    // Calculate next date
                    if (repeatFrequency === "daily") {
                        currentDate.setDate(currentDate.getDate() + 1);
                    } else if (repeatFrequency === "weekly") {
                        currentDate.setDate(currentDate.getDate() + 7);
                    } else if (repeatFrequency === "monthly") {
                        currentDate.setMonth(currentDate.getMonth() + 1);
                    }

                    // Format back to DD/MM/YYYY
                    const nextDay = String(currentDate.getDate()).padStart(2, '0');
                    const nextMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const nextYear = currentDate.getFullYear();
                    const nextDateStr = `${nextDay}/${nextMonth}/${nextYear}`;

                    // Generate new token
                    const nextPayload = { email: Name + i + Date.now() }; // Ensure uniqueness
                    const nextToken = await jwt.sign(nextPayload, secret);

                    const recurringEvent = new Event({
                        event_id: nextToken,
                        name: `${Name} (${i + 1})`, // Optional: Add sequence number
                        venue: Venue,
                        date: nextDateStr,
                        time: Time,
                        endDate: EndDate,
                        endTime: EndTime,
                        description: Desc,
                        price: Price,
                        profile: Profile,
                        cover: Cover,
                        organizer: organizerName,
                        category: Category,
                        address: Address,
                        lat: Lat,
                        lng: Lng,
                        capacity: Capacity || 0,
                        ownerId: adminId || userId,
                        ticketTypes: TicketTypes,
                        registrationQuestions: RegistrationQuestions,
                        visibility: Visibility || "public",
                        requiresApproval: RequiresApproval || false,
                        waitlistEnabled: WaitlistEnabled || false,
                        hideLocation: HideLocation || false,
                    });

                    await recurringEvent.save();
                    console.log(`Saved::Recurring Event::${i + 1} created.`);

                    // Update User/Admin
                    const eventData = {
                        event_id: nextToken,
                        name: recurringEvent.name,
                        venue: Venue,
                        date: nextDateStr,
                        time: Time,
                        endDate: EndDate,
                        endTime: EndTime,
                        description: Desc,
                        price: Price,
                        profile: recurringEvent.profile || "https://i.etsystatic.com/15907303/r/il/c8acad/1940223106/il_794xN.1940223106_9tfg.jpg",
                        cover: recurringEvent.cover || "https://eventplanning24x7.files.wordpress.com/2018/04/events.png",
                        organizer: organizerName,
                        category: Category,
                        address: Address,
                        lat: Lat,
                        lng: Lng,
                    };

                    if (adminId) {
                        await Admin.updateOne({ admin_id: adminId }, { $push: { eventCreated: eventData } });
                    }
                    if (userId) {
                        await User.updateOne({ user_token: userId }, { $push: { eventCreated: eventData } });
                    }
                }
            };
            createRecurringEvents(); // Run asynchronously
        }

    } catch (err) {
        console.log(err);
    }

    if (adminId) {
        await Admin.updateOne({ admin_id: adminId }, {
            $push: {
                eventCreated: {
                    event_id: token,
                    name: Name,
                    venue: Venue,
                    date: Date,
                    time: Time,
                    endDate: EndDate,
                    endTime: EndTime,
                    description: Desc,
                    price: Price,
                    profile: Profile == null ?
                        "https://i.etsystatic.com/15907303/r/il/c8acad/1940223106/il_794xN.1940223106_9tfg.jpg" :
                        Profile,
                    cover: Cover == null ?
                        "https://eventplanning24x7.files.wordpress.com/2018/04/events.png" :
                        Cover,
                    organizer: organizerName,
                    category: Category,
                    address: Address,
                    lat: Lat,
                    lng: Lng,
                },
            },
        });
    }
    if (userId) {
        await User.updateOne({ user_token: userId }, {
            $push: {
                eventCreated: {
                    event_id: token,
                    name: Name,
                    venue: Venue,
                    date: Date,
                    time: Time,
                    endDate: EndDate,
                    endTime: EndTime,
                    description: Desc,
                    price: Price,
                    profile: Profile == null ?
                        "https://i.etsystatic.com/15907303/r/il/c8acad/1940223106/il_794xN.1940223106_9tfg.jpg" :
                        Profile,
                    cover: Cover == null ?
                        "https://eventplanning24x7.files.wordpress.com/2018/04/events.png" :
                        Cover,
                    organizer: organizerName,
                    category: Category,
                    address: Address,
                    lat: Lat,
                    lng: Lng,
                },
            },
        });
    }

    res.status(200).send({ msg: "event created", event_id: token });
};

const updateEvent = async(req, res) => {
    const eventId = req.body.event_id;
    const adminId = req.body.admin_id;
    const userId = req.body.user_token || req.body.user_id;

    const allowed = [
        "name",
        "venue",
        "address",
        "lat",
        "lng",
        "date",
        "time",
        "endDate",
        "endTime",
        "description",
        "price",
        "profile",
        "cover",
        "organizer",
        "category",
        "capacity",
        "ticketTypes",
        "registrationQuestions",
        "visibility",
        "requiresApproval",
        "waitlistEnabled",
        "hideLocation",
        "isPremium", // Allow premium status update after payment
    ];
    const payload = req.body.update || {};
    const toSet = {};
    for (const k of allowed)
        if (payload[k] !== undefined) toSet[k] = payload[k];
    try {
        const ev = await Event.findOne({ event_id: eventId });
        if (!ev) return res.status(404).send({ msg: "Event not found" });
        const tokenStr = adminId || userId;
        const isOwner = tokenStr && ev.ownerId === tokenStr;
        const isAdmin = !!adminId;
        if (!isOwner && !isAdmin) return res.status(403).send({ msg: "Forbidden" });
        await Event.updateOne({ event_id: eventId }, { $set: toSet });
        res.status(200).send({ msg: "event updated" });
    } catch (e) {
        console.log(e);
        res.status(400).send({ msg: "Error updating event" });
    }
};

const allEvents = async(req, res) => {
    try {
        const events = await Event.find({ 
            visibility: { $ne: "private" },
            cancelled: { $ne: true }
        })
            .sort({ isPremium: -1, _id: -1 });

        // Filter out past events
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredEvents = events.filter(event => {
            if (!event.date) return false;
            const parts = event.date.split('/');
            if (parts.length !== 3) return false;
            const eventDate = new Date(parts[2], parts[1] - 1, parts[0]);
            // Keep events that are today or in the future
            return eventDate >= today;
        });

        res.status(200).send(filteredEvents);
    } catch (err) {
        res.status(400).send({ msg: "Error fetching data", error: err });
    }
};

const getUserEvents = async(req, res) => {
    const userId = req.body.user_token || req.body.user_id;
    if (!userId) return res.status(400).send({ msg: "User ID required" });

    try {
        // Find events where user is a participant or owner (exclude cancelled/deleted)
        const events = await Event.find({
            $or: [
                { "participants.id": userId },
                { ownerId: userId }
            ],
            cancelled: { $ne: true }
        }).sort({ date: 1 });

        const now = new Date();

        const upcoming = [];
        const live = [];
        const past = [];

        events.forEach(event => {
            if (!event.date || !event.time) return;
            
            // Parse date (DD/MM/YYYY)
            const dateParts = event.date.split('/');
            if (dateParts.length !== 3) return;
            
            // Parse time (e.g., "3:00 PM" or "15:00")
            const timeStr = event.time.trim();
            let hours = 0, minutes = 0;
            
            // Handle 12-hour format (3:00 PM)
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
                const [time, period] = timeStr.split(' ');
                const [h, m] = time.split(':').map(Number);
                hours = period === 'PM' && h !== 12 ? h + 12 : (period === 'AM' && h === 12 ? 0 : h);
                minutes = m || 0;
            } else {
                // Handle 24-hour format
                const [h, m] = timeStr.split(':').map(Number);
                hours = h;
                minutes = m || 0;
            }
            
            // Create event start datetime
            const eventStart = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], hours, minutes);
            
            // Create event end datetime
            let eventEnd = new Date(eventStart);
            if (event.endDate && event.endTime) {
                const endDateParts = event.endDate.split('/');
                const endTimeStr = event.endTime.trim();
                let endHours = 0, endMinutes = 0;
                
                if (endTimeStr.includes('AM') || endTimeStr.includes('PM')) {
                    const [time, period] = endTimeStr.split(' ');
                    const [h, m] = time.split(':').map(Number);
                    endHours = period === 'PM' && h !== 12 ? h + 12 : (period === 'AM' && h === 12 ? 0 : h);
                    endMinutes = m || 0;
                } else {
                    const [h, m] = endTimeStr.split(':').map(Number);
                    endHours = h;
                    endMinutes = m || 0;
                }
                
                eventEnd = new Date(endDateParts[2], endDateParts[1] - 1, endDateParts[0], endHours, endMinutes);
            } else {
                // If no end time, assume event lasts 3 hours
                eventEnd = new Date(eventStart.getTime() + 3 * 60 * 60 * 1000);
            }
            
            // Debug logging
            console.log(`Event: ${event.name}`);
            console.log(`  Start: ${eventStart.toISOString()}`);
            console.log(`  End: ${eventEnd.toISOString()}`);
            console.log(`  Now: ${now.toISOString()}`);
            console.log(`  Category: ${now < eventStart ? 'upcoming' : now <= eventEnd ? 'live' : 'past'}`);
            
            // Categorize based on current time
            if (now < eventStart) {
                // Event hasn't started yet
                upcoming.push(event);
            } else if (now >= eventStart && now <= eventEnd) {
                // Event is currently happening
                live.push(event);
            } else {
                // Event has ended
                // Show past events if user was a participant (registered) OR is the owner
                const isParticipant = event.participants && event.participants.some(p => p.id === userId);
                const isOwner = event.ownerId === userId;
                console.log(`  Is Participant: ${isParticipant}, Is Owner: ${isOwner}`);
                if (isParticipant || isOwner) {
                    past.push(event);
                }
            }
        });

        res.status(200).send({ upcoming, live, past });
    } catch (err) {
        console.error(err);
        res.status(500).send({ msg: "Error fetching user events" });
    }
};

const particularEvent = async(req, res) => {
    const eventId = req.body.event_id;
    const userId = req.body.user_id || req.body.user_token; // Optional user context

    try {
        const events = await Event.find({ event_id: eventId });
        if (!events || events.length === 0) return res.status(404).send({ msg: "Event not found" });

        let event = events[0].toObject();

        // Handle Hide Location logic
        if (event.hideLocation) {
            let canSeeLocation = false;
            // Owner can see
            if (userId && (event.ownerId === userId)) canSeeLocation = true;
            // Participants can see
            if (userId && event.participants && event.participants.some(p => p.id === userId)) canSeeLocation = true;

            if (!canSeeLocation) {
                event.venue = "Location Hidden";
                event.address = "Registered Attendees Only";
                event.lat = null;
                event.lng = null;
            }
        }

        // Handle Registration Token Security
        if (event.registrationToken && event.registrationToken.trim() !== "") {
            event.hasRegistrationToken = true;
            delete event.registrationToken; // Do not expose the actual token
        } else {
            event.hasRegistrationToken = false;
        }

        // Increment Views
        await Event.updateOne({ event_id: eventId }, { $inc: { views: 1 } });
        event.views = (event.views || 0) + 1; // Reflect in response

        res.status(200).send(event);
    } catch (err) {
        res.status(400).send({ msg: "Error fetching event", error: err });
    }
};

const deleteEvent = async(req, res) => {
    try {
        const eventId = req.body.event_id;
        const adminId = req.body.admin_id;
        const userId = req.body.user_id;

        // Find the event
        const event = await Event.findOne({ event_id: eventId });
        if (!event) {
            return res.status(404).send({ msg: "Event not found" });
        }

        // Check if tickets have been sold
        const ticketsSold = event.participants && event.participants.length > 0;
        
        if (ticketsSold) {
            return res.status(400).send({ 
                msg: "Cannot delete event with sold tickets. Please cancel the event instead to process refunds.",
                ticketsSold: event.participants.length
            });
        }

        // Delete event
        await Event.deleteOne({ event_id: eventId });
        console.log("Event deleted::events collection.");
        
        if (global.io) {
            global.io.emit("event_deleted", { eventId: eventId });
        }

        // Remove from admin/user collections
        if (adminId) {
            await Admin.updateOne(
                { admin_id: adminId }, 
                { $pull: { eventCreated: { event_id: eventId } } }
            );
            console.log("Event deleted::admin collection.");
        }
        
        if (userId) {
            await User.updateOne(
                { user_token: userId }, 
                { $pull: { eventCreated: { event_id: eventId } } }
            );
            console.log("Event deleted::user collection.");
        }

        res.status(200).send({ msg: "Event deleted successfully" });
    } catch (error) {
        console.error("Delete event error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

const cancelEvent = async(req, res) => {
    try {
        const eventId = req.body.event_id;
        const userId = req.body.user_id;
        const adminId = req.body.admin_id;
        const reason = req.body.reason || "Event cancelled by organizer";

        // Find the event
        const event = await Event.findOne({ event_id: eventId });
        if (!event) {
            return res.status(404).send({ msg: "Event not found" });
        }

        // Check if already cancelled
        if (event.cancelled) {
            return res.status(400).send({ msg: "Event is already cancelled" });
        }

        // Get organizer
        const organizer = await User.findOne({ user_token: event.ownerId });
        if (!organizer) {
            return res.status(404).send({ msg: "Organizer not found" });
        }

        // Process refunds for all participants
        const { processRefund } = require("./walletController");
        const { createNotification } = require("./notificationController");
        const Transaction = require("../models/Transaction");
        
        let totalRefunds = 0;
        const refundPromises = [];

        for (const participant of event.participants) {
            const amountPaid = participant.amount_paid || 0;
            
            if (amountPaid > 0) {
                totalRefunds += amountPaid;
                
                // Process refund
                refundPromises.push(
                    processRefund(participant.user_id, amountPaid, eventId, event.name)
                );
                
                // Deduct from organizer's wallet
                if (organizer.wallet.availableBalance >= amountPaid) {
                    organizer.wallet.availableBalance -= amountPaid;
                } else if (organizer.wallet.lockedBalance >= amountPaid) {
                    organizer.wallet.lockedBalance -= amountPaid;
                } else {
                    // Deduct from both if needed
                    const fromAvailable = Math.min(organizer.wallet.availableBalance, amountPaid);
                    const fromLocked = amountPaid - fromAvailable;
                    organizer.wallet.availableBalance -= fromAvailable;
                    organizer.wallet.lockedBalance -= fromLocked;
                }
                
                // Create refund transaction for organizer
                await Transaction.create({
                    userId: organizer.user_token,
                    type: 'refund_sent',
                    amount: -amountPaid,
                    description: `Refund sent - ${event.name} (Cancelled)`,
                    eventId,
                    eventName: event.name,
                    status: 'completed'
                });
            }
        }

        // Wait for all refunds to process
        await Promise.all(refundPromises);
        
        // Save organizer wallet changes
        await organizer.save();

        // Mark event as cancelled
        event.cancelled = true;
        event.cancelledAt = new Date();
        event.cancelReason = reason;
        await event.save();

        // Send cancellation emails to all participants
        const { sendEventCancellationEmail } = require("../utils/emailService");
        for (const participant of event.participants) {
            try {
                const participantUser = await User.findOne({ user_token: participant.id });
                if (participantUser && participantUser.email) {
                    await sendEventCancellationEmail({
                        email: participantUser.email,
                        name: participantUser.displayName || participantUser.username,
                        eventName: event.name,
                        reason,
                        refundAmount: participant.amount_paid || 0
                    });
                }
            } catch (emailError) {
                console.error(`Error sending cancellation email to ${participant.email}:`, emailError);
            }
        }

        // Notify organizer
        await createNotification(
            organizer.user_token,
            'event_cancelled',
            'Event Cancelled',
            `"${event.name}" has been cancelled. ₦${totalRefunds.toLocaleString()} in refunds have been processed.`,
            `/event/${eventId}/manage`
        );

        // Emit socket event
        if (global.io) {
            global.io.emit("event_cancelled", { eventId, eventName: event.name });
        }

        res.status(200).send({ 
            msg: "Event cancelled successfully. All participants have been refunded.",
            totalRefunds,
            participantsRefunded: event.participants.length
        });
    } catch (error) {
        console.error("Cancel event error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

const checkin = async(req, res) => {
    const eventId = req.body.event_id;
    const userList = req.body.checkInList;

    if (!eventId || !userList || !Array.isArray(userList)) {
        return res.status(400).send({ msg: "Invalid request data" });
    }

    try {
        const event = await Event.findOne({ event_id: eventId });
        if (!event) return res.status(404).send({ msg: "Event not found" });

        const eventName = event.name;

        for (const userId of userList) {
            await Event.updateOne({ event_id: eventId, "participants.id": userId }, { $set: { "participants.$.entry": true } });

            console.log(`user :: checked-in :: ${userId}`);

            try {
                if (global.io) {
                    global.io.emit("checkin", {
                        event_id: eventId,
                        user_id: userId,
                        status: "checked_in",
                    });
                }
            } catch (e) {
                console.error("Socket error:", e);
            }

            try {
                const user = await User.findOne({ user_token: userId });
                if (user) {
                    const data_obj = {
                        name: user.username || user.displayName || "Guest",
                        regNo: user.reg_number,
                        email: user.email,
                        number: user.contactNumber,
                        event: eventName,
                    };
                    await sendCheckInEmail(data_obj);
                }
            } catch (err) {
                console.error("Email/User fetch error:", err);
            }
        }

        res.status(200).send({ msg: "success" });
    } catch (err) {
        console.error("Checkin error:", err);
        res.status(500).send({ msg: "Server error during checkin", error: err.message });
    }
};

const submitFeedback = async(req, res) => {
    const { event_id, user_id, rating, comment } = req.body;
    try {
        const event = await Event.findOne({ event_id });
        if (!event) return res.status(404).send({ msg: "Event not found" });

        const feedbackItem = {
            userId: user_id,
            rating,
            comment,
            timestamp: new Date()
        };

        event.feedback.push(feedbackItem);
        await event.save();

        res.status(200).send({ msg: "Feedback submitted successfully" });
    } catch (e) {
        console.error(e);
        res.status(500).send({ msg: "Error submitting feedback" });
    }
};

const duplicateEvent = async(req, res) => {
    const eventId = req.params.eventId || req.body.event_id;
    const userId = req.user.user_token || req.user.id;

    try {
        const originalEvent = await Event.findOne({ event_id: eventId });
        if (!originalEvent) {
            return res.status(404).send({ msg: "Event not found" });
        }

        // Check ownership
        if (originalEvent.ownerId !== userId && req.user.role !== "ADMIN") {
            return res.status(403).send({ msg: "Unauthorized" });
        }

        const newName = `${originalEvent.name} (Copy)`;
        const payload = { email: newName + Date.now() }; // Ensure unique token
        const newToken = await jwt.sign(payload, JWT_SECRET);

        const newEvent = new Event({
            event_id: newToken,
            name: `${originalEvent.name} (Copy)`,
            venue: originalEvent.venue,
            date: originalEvent.date,
            time: originalEvent.time,
            description: originalEvent.description,
            price: originalEvent.price,
            profile: originalEvent.profile,
            cover: originalEvent.cover,
            organizer: originalEvent.organizer,
            category: originalEvent.category,
            address: originalEvent.address,
            lat: originalEvent.lat,
            lng: originalEvent.lng,
            capacity: originalEvent.capacity,
            ownerId: userId, // New owner
            ticketTypes: originalEvent.ticketTypes.map(t => ({...t, sold: 0 })), // Reset sold count
            registrationQuestions: originalEvent.registrationQuestions,
            visibility: originalEvent.visibility,
            requiresApproval: originalEvent.requiresApproval,
            waitlistEnabled: originalEvent.waitlistEnabled,
            hideLocation: originalEvent.hideLocation,
            // Reset participants, waitlist, etc.
            participants: [],
            waitlist: [],
            pendingParticipants: [],
            feedback: []
        });

        await newEvent.save();

        // Add to User's created events
        const eventData = {
            event_id: newToken,
            name: newEvent.name,
            venue: newEvent.venue,
            date: newEvent.date,
            time: newEvent.time,
            description: newEvent.description,
            price: newEvent.price,
            profile: newEvent.profile,
            cover: newEvent.cover,
            organizer: newEvent.organizer,
            category: newEvent.category,
            address: newEvent.address,
            lat: newEvent.lat,
            lng: newEvent.lng,
        };

        await User.updateOne({ user_token: userId }, { $push: { eventCreated: eventData } });

        res.status(200).send({ msg: "Event duplicated successfully", event_id: newToken });
    } catch (e) {
        console.error(e);
        res.status(500).send({ msg: "Error duplicating event" });
    }
};

const manageParticipant = async(req, res) => {
    const { eventId, userId, action } = req.body; // action: 'approve', 'reject', 'waitlist_promote'

    try {
        const event = await Event.findOne({ event_id: eventId });
        if (!event) return res.status(404).send({ msg: "Event not found" });

        // Check ownership
        if (event.ownerId !== req.user.user_token && event.ownerId !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).send({ msg: "Unauthorized" });
        }

        if (action === 'approve') {
            const pending = event.pendingParticipants.find(p => p.userId === userId);
            if (!pending) return res.status(404).send({ msg: "User not found in pending list" });

            // Move to participants
            const participantData = {
                id: pending.userId,
                name: pending.name,
                email: pending.email,
                passID: pending.userId, // Using userId as passID for now
                entry: false,
                ticketType: pending.ticketType,
                answers: pending.answers
            };

            event.participants.push(participantData);
            event.pendingParticipants = event.pendingParticipants.filter(p => p.userId !== userId);
            await event.save();

            if (global.io) global.io.emit("participant_updated", { eventId: eventId });

            // TODO: Send approval email

            return res.status(200).send({ msg: "User approved" });
        }

        if (action === 'reject') {
            event.pendingParticipants = event.pendingParticipants.filter(p => p.userId !== userId);
            await event.save();
            if (global.io) global.io.emit("participant_updated", { eventId: eventId });
            return res.status(200).send({ msg: "User rejected" });
        }

        if (action === 'waitlist_promote') {
            const waiter = event.waitlist.find(p => p.userId === userId);
            if (!waiter) return res.status(404).send({ msg: "User not found in waitlist" });

            const participantData = {
                id: waiter.userId,
                name: waiter.name,
                email: waiter.email,
                passID: waiter.userId,
                entry: false,
                ticketType: "Waitlist Promoted",
                answers: {}
            };

            event.participants.push(participantData);
            event.waitlist = event.waitlist.filter(p => p.userId !== userId);
            await event.save();

            if (global.io) global.io.emit("participant_updated", { eventId: eventId });

            return res.status(200).send({ msg: "User promoted from waitlist" });
        }

        if (action === 'remove') {
            const exists = event.participants.find(p => p.id === userId);
            if (!exists) return res.status(404).send({ msg: "User not found in participants" });

            event.participants = event.participants.filter(p => p.id !== userId);
            await event.save();
            if (global.io) global.io.emit("participant_updated", { eventId: eventId });
            return res.status(200).send({ msg: "User removed from event" });
        }

        res.status(400).send({ msg: "Invalid action" });
    } catch (e) {
        console.error(e);
        res.status(500).send({ msg: "Error managing participant" });
    }
};

const getMyEvents = async(req, res) => {
    const userId = req.user.user_token || req.user.id || req.body.user_token;
    if (!userId) return res.status(400).send({ msg: "User ID required" });

    try {
        const events = await Event.find({ ownerId: userId });
        res.status(200).send(events);
    } catch (e) {
        console.error(e);
        res.status(500).send({ msg: "Error fetching events" });
    }
};

const exportGuests = async(req, res) => {
    const { eventId, format, token } = req.body; // format could be 'csv' or 'json' (default csv)
    try {
        const event = await Event.findOne({ event_id: eventId });
        if (!event) return res.status(404).send({ msg: "Event not found" });

        // Security check
        const isOwner = token && (event.ownerId === token);
        // We might also want to check for Admin if we had an Admin model check here, but simplified:
        // Ideally verify token validity via middleware or helper, but for now matching ID/Token
        if (!isOwner) {
            // Allow admins if token matches an admin (would need DB check, skipping for speed/safety tradeoff unless critical)
            // Let's assume strict owner check for now as it's safest without full auth context
            // If token is an admin ID (if we passed adminToken), we might need to check Admin collection.
            // But existing code uses simple token comparison for owners.
            // Let's verify if 'token' is the ownerId.
            // NOTE: Real-world apps should decode JWT. Here we assume token is the ID/stored token.
            if (event.ownerId !== token) {
                // Double check if it's an admin (optional, but good)
                const Admin = require("../models/admin");
                const admin = await Admin.findOne({ admin_id: token });
                if (!admin) return res.status(403).send({ msg: "Unauthorized" });
            }
        }

        const participants = event.participants || [];

        // Flatten data
        const headers = ["Name", "Email", "Ticket Type", "Status", "Checked In", "Registration Date"];
        // Collect all unique question labels for headers
        const questionLabels = new Set();
        participants.forEach(p => {
            if (p.answers) Object.keys(p.answers).forEach(k => questionLabels.add(k));
        });
        const qHeaders = Array.from(questionLabels);
        const allHeaders = [...headers, ...qHeaders];

        // Create CSV String
        let csvContent = allHeaders.join(",") + "\n";

        participants.forEach(p => {
            const row = [
                `"${(p.name || "").replace(/"/g, '""')}"`,
                `"${(p.email || "").replace(/"/g, '""')}"`,
                `"${(p.ticketType || "General").replace(/"/g, '""')}"`,
                "Registered", // Status
                p.entry ? "Yes" : "No",
                // Date might not be stored in participant object directly in legacy data, assume now or check if it exists
                // The current schema doesn't strictly enforce a date field in participant object array, 
                // but pendingParticipants has it. If missing, leave blank.
                `"${p.date ? new Date(p.date).toISOString() : ""}"`
            ];

            // Add answers
            qHeaders.forEach(q => {
                const ans = p.answers ? p.answers[q] : "";
                row.push(`"${(ans || "").toString().replace(/"/g, '""')}"`);
            });

            csvContent += row.join(",") + "\n";
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${event.name.replace(/[^a-z0-9]/gi, '_')}_guests.csv"`);
        res.status(200).send(csvContent);

    } catch (e) {
        console.error(e);
        res.status(500).send({ msg: "Error exporting guests" });
    }
};

module.exports = {
    postEvent,
    allEvents,
    particularEvent,
    deleteEvent,
    cancelEvent,
    checkin,
    updateEvent,
    duplicateEvent,
    manageParticipant,
    getMyEvents,
    submitFeedback,
    exportGuests,
    getUserEvents
};