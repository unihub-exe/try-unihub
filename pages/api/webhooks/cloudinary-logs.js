/**
 * Cloudinary Webhook Logs API
 * Optional endpoint to view recent webhook activity
 * For debugging and monitoring purposes
 */

// In-memory storage (replace with database in production)
let webhookLogs = [];
const MAX_LOGS = 100;

/**
 * Add log entry
 */
export function addWebhookLog(entry) {
    webhookLogs.unshift({
        ...entry,
        timestamp: new Date().toISOString(),
    });
    
    // Keep only last MAX_LOGS entries
    if (webhookLogs.length > MAX_LOGS) {
        webhookLogs = webhookLogs.slice(0, MAX_LOGS);
    }
}

/**
 * Get webhook logs
 */
export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // TODO: Add authentication check here
    // const isAdmin = await checkAdminAuth(req);
    // if (!isAdmin) {
    //     return res.status(403).json({ error: "Forbidden" });
    // }

    const limit = parseInt(req.query.limit) || 50;
    const logs = webhookLogs.slice(0, limit);

    return res.status(200).json({
        total: webhookLogs.length,
        logs,
    });
}
