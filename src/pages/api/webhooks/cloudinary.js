/**
 * Cloudinary Webhook Handler (Simplified)
 * Just logs webhook notifications - actual image URLs are saved on upload
 */

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { notification_type, public_id, secure_url } = req.body;

        console.log('Cloudinary webhook:', {
            notification_type,
            public_id,
            secure_url
        });

        res.status(200).json({ 
            success: true, 
            message: 'Webhook received'
        });
    } catch (error) {
        console.error('Cloudinary webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}
