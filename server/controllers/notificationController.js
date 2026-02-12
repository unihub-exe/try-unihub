const webpush = require("web-push");
const User = require("../models/user");
let WEBPUSH_ENABLED = false;
try {
  const vapid = (() => {
    try { return require("../vapid.json"); } catch (_) { return {}; }
  })();
  const subject = process.env.MAILTO || "mailto:noreply@unihub.app";
  const pub = process.env.VAPID_PUBLIC_KEY || vapid.publicKey;
  const priv = process.env.VAPID_PRIVATE_KEY || vapid.privateKey;
  if (subject && pub && priv) {
    webpush.setVapidDetails(subject, pub, priv);
    WEBPUSH_ENABLED = true;
  }
} catch (_) {}

// Subscribe to push notifications
const subscribe = async (req, res) => {
  const { subscription } = req.body;
  const userId = req.user.id; // Assuming auth middleware adds user to req

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription object" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if subscription already exists
    const existingSubscription = user.pushSubscriptions.find(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (!existingSubscription) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.status(201).json({ message: "Subscription added successfully" });
  } catch (error) {
    console.error("Error saving subscription:", error);
    res.status(500).json({ error: "Failed to save subscription" });
  }
};

// Send notification helper (internal use)
const sendNotificationToUser = async (userId, payload) => {
  try {
    if (!WEBPUSH_ENABLED) return;
    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    const notifications = user.pushSubscriptions.map((sub) =>
      webpush.sendNotification(sub, JSON.stringify(payload)).catch((err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription is invalid or expired, remove it
          console.log("Removing invalid subscription:", sub.endpoint);
          user.pushSubscriptions = user.pushSubscriptions.filter(
            (s) => s.endpoint !== sub.endpoint
          );
        } else {
          console.error("Error sending notification:", err);
        }
      })
    );

    await Promise.all(notifications);
    await user.save();
  } catch (error) {
    console.error("Error in sendNotificationToUser:", error);
  }
};

// Test endpoint to trigger a notification to self
const testNotification = async (req, res) => {
    const userId = req.user.id;
    const payload = {
        title: "Test Notification",
        body: "This is a test notification from UniHub!",
        url: "/"
    };
    await sendNotificationToUser(userId, payload);
    res.json({ message: "Notification sent" });
};

module.exports = {
  subscribe,
  sendNotificationToUser,
  testNotification
};
