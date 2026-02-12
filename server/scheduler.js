const cron = require("node-cron");
const { Event } = require("./models/event");
const User = require("./models/user");
const { sendNotificationToUser } = require("./controllers/notificationController");
const { sendReminderEmail } = require("./utils/emailService");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

let twilioClient = null;
try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (sid && token) {
        twilioClient = require("twilio")(sid, token);
    }
} catch (e) {
    console.log("Twilio not configured");
}

const parseDateTime = (dateStr, timeStr) => {
    try {
        // dateStr: "DD/MM/YYYY" or "YYYY-MM-DD"
        // timeStr: "HH:mm" or "h:mm A"
        
        let day, month, year;
        if (dateStr.includes("/")) {
            [day, month, year] = dateStr.split("/").map(Number);
        } else if (dateStr.includes("-")) {
            [year, month, day] = dateStr.split("-").map(Number);
        } else {
            return null;
        }

        let hours = 0, minutes = 0;
        if (timeStr) {
            const [time, modifier] = timeStr.split(" ");
            let [h, m] = time.split(":").map(Number);
            
            if (modifier) {
                if (modifier.toUpperCase() === "PM" && h < 12) h += 12;
                if (modifier.toUpperCase() === "AM" && h === 12) h = 0;
            }
            hours = h;
            minutes = m;
        }

        return new Date(year, month - 1, day, hours, minutes);
    } catch (e) {
        return null;
    }
};

const sendWhatsAppReminder = async (phone, message) => {
    if (!twilioClient || !phone) return;
    try {
        const from = process.env.TWILIO_WHATSAPP_FROM; // e.g., +14155238886
        let to = String(phone).replace(/\s+/g, "");
        if (!to.startsWith("+")) to = "+234" + (to.startsWith("0") ? to.slice(1) : to); // Default to NG or handle generally

        await twilioClient.messages.create({
            from: `whatsapp:${from}`,
            to: `whatsapp:${to}`,
            body: message,
        });
        console.log(`WhatsApp sent to ${to}`);
    } catch (e) {
        console.error("WhatsApp error:", e);
    }
};

const sendSMS = async (phone, message) => {
    if (!twilioClient || !phone) return;
    try {
        const from = process.env.TWILIO_PHONE_NUMBER; 
        let to = String(phone).replace(/\s+/g, "");
        if (!to.startsWith("+")) to = "+234" + (to.startsWith("0") ? to.slice(1) : to);

        if (from) {
             await twilioClient.messages.create({
                from: from,
                to: to,
                body: message,
            });
            console.log(`SMS sent to ${to}`);
        }
    } catch (e) {
        console.error("SMS error:", e);
    }
};

const checkReminders = async () => {
    console.log("Checking for event reminders...");
    const events = await Event.find({});
    const now = new Date();

    for (const event of events) {
        const eventDate = parseDateTime(event.date, event.time);
        if (!eventDate) continue;

        const diffMs = eventDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        // Define thresholds (in hours)
        // 1 week = 168h
        // 3 days = 72h
        // 1 day = 24h
        // 1 hour = 1h

        // Helper to send batch notifications
        const sendBatch = async (type) => {
            console.log(`Sending ${type} reminders for event: ${event.name}`);
            
            // Get participants with user details
            const participantIds = event.participants.map(p => p.id || p.userId).filter(Boolean);
            
            // We might need to fetch user details if not fully in participants array
            // Assuming participants array has basic info, but let's fetch Users to be safe for Push/Phone
            const users = await User.find({ 
                $or: [
                    { user_token: { $in: participantIds } },
                    { _id: { $in: participantIds } } // Handle both ID types
                ]
            });

            for (const user of users) {
                const message = `Reminder: ${event.name} is starting in ${type}!`;
                
                // 1. Push Notification
                await sendNotificationToUser(user._id, {
                    title: "Event Reminder",
                    body: message,
                    url: `/event/${event.event_id}`
                });

                // 2. Email
                if (user.email) {
                    await sendReminderEmail(user.email, `Reminder: ${event.name}`, `<p>Hello ${user.username},</p><p>${message}</p><p>Check details: <a href="${process.env.CLIENT_URL}/event/${event.event_id}">Here</a></p>`);
                }

                // 3. WhatsApp / SMS
                if (user.contactNumber) {
                    await sendWhatsAppReminder(user.contactNumber, message);
                    await sendSMS(user.contactNumber, message);
                }
            }
        };

        // 1 Week Reminder (approx 168 hours, allow window of 1 hour)
        if (diffHours > 167 && diffHours < 169 && !event.remindersSent?.week) {
            await sendBatch("1 week");
            event.remindersSent = { ...event.remindersSent, week: true };
            await event.save();
        }

        // 3 Days Reminder (approx 72 hours)
        if (diffHours > 71 && diffHours < 73 && !event.remindersSent?.threeDays) {
            await sendBatch("3 days");
            event.remindersSent = { ...event.remindersSent, threeDays: true };
            await event.save();
        }

        // 1 Day Reminder (approx 24 hours)
        if (diffHours > 23 && diffHours < 25 && !event.remindersSent?.day) {
            await sendBatch("1 day");
            event.remindersSent = { ...event.remindersSent, day: true };
            await event.save();
        }

        // 1 Hour Reminder
        if (diffHours > 0.5 && diffHours < 1.5 && !event.remindersSent?.hour) {
            await sendBatch("1 hour");
            event.remindersSent = { ...event.remindersSent, hour: true };
            await event.save();
        }

        // Follow-up (24 hours AFTER event)
        if (diffHours < -24 && diffHours > -26 && !event.remindersSent?.followUp) {
             console.log(`Sending follow-up for event: ${event.name}`);
             const participantIds = event.participants.map(p => p.id || p.userId).filter(Boolean);
             const users = await User.find({ user_token: { $in: participantIds } });
             
             for (const user of users) {
                // Email Survey
                if (user.email) {
                    await sendReminderEmail(user.email, `How was ${event.name}?`, `<p>Hello ${user.username},</p><p>Thank you for attending ${event.name}. We'd love your feedback!</p><p><a href="${process.env.CLIENT_URL}/event/${event.event_id}?feedback=true">Leave Feedback</a></p>`);
                }
             }
             event.remindersSent = { ...event.remindersSent, followUp: true };
             await event.save();
        }
    }
};

const initScheduler = () => {
    // Run every hour
    cron.schedule("0 * * * *", () => {
        checkReminders();
    });
    console.log("Scheduler initialized");
};

module.exports = { initScheduler };
