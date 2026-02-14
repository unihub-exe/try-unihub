import crypto from "crypto";
import { addWebhookLog } from "./cloudinary-logs";

/**
 * Cloudinary Webhook Handler
 * Handles async upload notifications and eager transformations from Cloudinary
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
 */
function verifySignature(body, timestamp, signature) {
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!apiSecret) {
        console.error("CLOUDINARY_API_SECRET not configured");
        return false;
    }

    const expectedSignature = crypto
        .createHash("sha256")
        .update(body + timestamp + apiSecret)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

/**
 * Delete old Cloudinary asset
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
 * Update event images in database
 */
async function updateEventImages(eventId, imageType, webpUrl, originalPublicId) {
    try {
        // Connect to MongoDB
        const mongoose = require("mongoose");
        
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGO_ATLAS_URI || process.env.MONGO_URI);
        }

        const Event = require("../../../server/models/event");
        
        const updateField = imageType === 'cover' ? 'cover' : 'profile';
        
        const result = await Event.findOneAndUpdate(
            { event_id: eventId },
            { [updateField]: webpUrl },
            { new: true }
        );

        if (result) {
            console.log(`Updated ${imageType} for event ${eventId} to WebP:`, webpUrl);
            
            // Delete the original non-WebP file
            if (originalPublicId) {
                await deleteOldAsset(originalPublicId);
            }
            
            return { success: true, eventId, imageType, webpUrl };
        } else {
            console.warn(`Event ${eventId} not found for image update`);
            return { success: false, error: "Event not found" };
        }
    } catch (error) {
        console.error(`Failed to update event ${eventId}:`, error);
        throw error;
    }
}

/**
 * Main webhook handler
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const rawBody = await getRawBody(req);
        const timestamp = req.headers["x-cld-timestamp"];
        const signature = req.headers["x-cld-signature"];

        // Verify signature
        if (!timestamp || !signature) {
            console.error("Missing signature headers");
            addWebhookLog({
                status: "error",
                error: "Missing signature headers",
            });
            return res.status(401).json({ error: "Missing signature headers" });
        }

        const isValid = verifySignature(rawBody, timestamp, signature);
        
        if (!isValid) {
            console.error("Invalid signature");
            addWebhookLog({
                status: "error",
                error: "Invalid signature",
            });
            return res.status(401).json({ error: "Invalid signature" });
        }

        const payload = JSON.parse(rawBody);
        
        console.log("Cloudinary webhook received:", {
            notification_type: payload.notification_type,
            public_id: payload.public_id,
            eager: payload.eager?.length || 0,
        });

        addWebhookLog({
            status: "received",
            notification_type: payload.notification_type,
            public_id: payload.public_id,
            has_eager: !!payload.eager,
        });

        // Handle eager transformation completion (WebP conversion)
        if (payload.eager && Array.isArray(payload.eager) && payload.eager.length > 0) {
            const webpTransformation = payload.eager.find(t => 
                t.secure_url && t.secure_url.includes('.webp')
            );

            if (webpTransformation) {
                const webpUrl = webpTransformation.secure_url;
                const originalPublicId = payload.public_id;
                
                // Parse context to get eventId and imageType
                const context = payload.context?.custom || {};
                const eventId = context.eventId;
                const imageType = context.imageType; // 'cover' or 'profile'

                console.log("WebP transformation complete:", {
                    eventId,
                    imageType,
                    webpUrl,
                    originalPublicId,
                });

                if (eventId && imageType) {
                    await updateEventImages(eventId, imageType, webpUrl, originalPublicId);
                    
                    addWebhookLog({
                        status: "success",
                        action: "webp_swap",
                        eventId,
                        imageType,
                        webpUrl,
                        originalPublicId,
                    });

                    return res.status(200).json({
                        message: "WebP transformation processed",
                        eventId,
                        imageType,
                        webpUrl,
                    });
                } else {
                    console.warn("Missing eventId or imageType in context");
                }
            }
        }

        // Handle initial upload (return immediate URL)
        if (payload.notification_type === "upload" || payload.notification_type === "success") {
            return res.status(200).json({
                message: "Upload notification received",
                public_id: payload.public_id,
            });
        }

        return res.status(200).json({
            message: "Webhook received",
            notification_type: payload.notification_type,
        });

    } catch (error) {
        console.error("Webhook processing error:", error);
        addWebhookLog({
            status: "error",
            error: error.message,
            stack: error.stack,
        });
        return res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
}