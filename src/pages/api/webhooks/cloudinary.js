import crypto from "crypto";
import { addWebhookLog } from "./cloudinary-logs";

/**
 * Cloudinary Webhook Handler
 * Handles async upload notifications from Cloudinary
 * Verifies signature, processes WebP conversions, and updates database
 */

// Disable body parsing to get raw body for signature verification
export const config = {
    api: {
        bodyParser: false,
    },
};

/**
 * Get raw body from request stream
 */
async function getRawBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => {
            data += chunk;
        });
        req.on("end", () => {
            resolve(data);
        });
        req.on("error", reject);
    });
}

/**
 * Verify Cloudinary webhook signature
 * @param {string} body - Raw request body
 * @param {string} timestamp - X-Cld-Timestamp header
 * @param {string} signature - X-Cld-Signature header
 * @returns {boolean} - True if signature is valid
 */
function verifySignature(body, timestamp, signature) {
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!apiSecret) {
        console.error("CLOUDINARY_API_SECRET not configured");
        return false;
    }

    // Cloudinary signature format: SHA256(body + timestamp + api_secret)
    const expectedSignature = crypto
        .createHash("sha256")
        .update(body + timestamp + apiSecret)
        .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

/**
 * Delete old Cloudinary asset
 * @param {string} publicId - Cloudinary public_id to delete
 */
async function deleteOldAsset(publicId) {
    try {
        const cloudinary = require("cloudinary").v2;
        
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted old asset ${publicId}:`, result);
        return result;
    } catch (error) {
        console.error(`Failed to delete old asset ${publicId}:`, error);
        throw error;
    }
}

/**
 * Update user profile image in database
 * @param {string} userId - User ID
 * @param {string} imageUrl - New image URL
 */
async function updateDatabase(userId, imageUrl) {
    // TODO: Implement your database update logic here
    // Example:
    // const User = require("@/models/User");
    // await User.findByIdAndUpdate(userId, { avatar: imageUrl });
    
    console.log(`[PLACEHOLDER] Update database for user ${userId} with image ${imageUrl}`);
    
    // For now, just log the action
    // Replace this with your actual database update code
    return { success: true, userId, imageUrl };
}

/**
 * Main webhook handler
 */
export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // Get raw body and headers
        const rawBody = await getRawBody(req);
        const timestamp = req.headers["x-cld-timestamp"];
        const signature = req.headers["x-cld-signature"];

        // Verify signature
        if (!timestamp || !signature) {
            console.error("Missing signature headers");
            addWebhookLog({
                status: "error",
                error: "Missing signature headers",
                headers: req.headers,
            });
            return res.status(401).json({ error: "Missing signature headers" });
        }

        const isValid = verifySignature(rawBody, timestamp, signature);
        
        if (!isValid) {
            console.error("Invalid signature");
            addWebhookLog({
                status: "error",
                error: "Invalid signature",
                timestamp,
            });
            return res.status(401).json({ error: "Invalid signature" });
        }

        // Parse the verified body
        const payload = JSON.parse(rawBody);
        
        console.log("Cloudinary webhook received:", {
            notification_type: payload.notification_type,
            public_id: payload.public_id,
        });

        addWebhookLog({
            status: "received",
            notification_type: payload.notification_type,
            public_id: payload.public_id,
            secure_url: payload.secure_url,
        });

        // Handle successful upload
        if (payload.notification_type === "upload" || payload.notification_type === "success") {
            const { secure_url, public_id, context } = payload;

            // Extract userId from context (you'll need to pass this during upload)
            const userId = context?.custom?.userId || context?.userId;
            const oldPublicId = context?.custom?.oldPublicId || context?.oldPublicId;

            if (!userId) {
                console.warn("No userId found in webhook payload context");
                return res.status(200).json({ 
                    message: "Webhook received but no userId to update" 
                });
            }

            // Update database with new image URL
            await updateDatabase(userId, secure_url);

            // Delete old asset if it exists
            if (oldPublicId && oldPublicId !== public_id) {
                try {
                    await deleteOldAsset(oldPublicId);
                } catch (error) {
                    // Log but don't fail the webhook if deletion fails
                    console.error("Failed to delete old asset:", error);
                }
            }

            addWebhookLog({
                status: "success",
                notification_type: payload.notification_type,
                public_id,
                secure_url,
                userId,
                oldPublicId,
            });

            return res.status(200).json({
                message: "Webhook processed successfully",
                public_id,
                secure_url,
            });
        }

        // Handle other notification types
        return res.status(200).json({
            message: "Webhook received",
            notification_type: payload.notification_type,
        });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
}
