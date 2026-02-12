const nodemailer = require("nodemailer");
const { createTransporter, getTransporter } = require("../utils/emailService");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });
let twilioClient = null;
try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (sid && token) {
        twilioClient = require("twilio")(sid, token);
    }
} catch (e) {}

function buildMapsLink(Details) {
    try {
        if (typeof Details.lat === "number" && typeof Details.lng === "number") {
            return `https://www.google.com/maps?q=${Details.lat},${Details.lng}`;
        }
        const q = Details.venue || Details.address1 || Details.city;
        if (q) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
        return null;
    } catch (e) { return null; }
}

function buildStaticMapImg(Details) {
    try {
        const key = process.env.GOOGLE_MAPS_STATIC_KEY;
        if (!key) return null;
        const size = "600x300";
        if (typeof Details.lat === "number" && typeof Details.lng === "number") {
            return `https://maps.googleapis.com/maps/api/staticmap?center=${Details.lat},${Details.lng}&zoom=15&size=${size}&markers=color:red%7C${Details.lat},${Details.lng}&key=${key}`;
        }
        const q = Details.venue || Details.address1 || Details.city;
        if (q) {
            return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(q)}&zoom=14&size=${size}&markers=color:red%7C${encodeURIComponent(q)}&key=${key}`;
        }
        return null;
    } catch (e) { return null; }
}

function sendTicket(Details) {
    const transporter = getTransporter();
    const baseUrl = process.env.CLIENT_BASE_URL || process.env.CLIENT_URL || "http://localhost:3000";
    const eventLink = Details.event_id ? `${baseUrl}/event/${Details.event_id}` : baseUrl;
    const mapsLink = buildMapsLink(Details);
    const staticImg = buildStaticMapImg(Details);

    // Use user name from Details (passed from payment controller)
    const userName = Details.name || "there";

    const mailOptions = {
            from: (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.NODE_MAILER_USER || "").trim(),
            to: Details.email,
            subject: `🎫 Your UniHub Ticket - ${Details.event_name}`,
            html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
                <div style="text-align: center; padding: 25px 20px; background: linear-gradient(135deg, #5F57F7 0%, #7C3AED 100%); border-radius: 16px 16px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 You're In!</h1>
                </div>
                <div style="background-color: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                        Hi <strong style="color: #5F57F7;">${userName}</strong>! 🙌<br>
                        Your ticket is confirmed for <strong>${Details.event_name}</strong>!
                    </p>
                    
                    <div style="background-color: #f1f5f9; border-left: 4px solid #5F57F7; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #5F57F7; font-size: 20px;">${Details.event_name}</h3>
                        <p style="margin: 8px 0; color: #475569;"><strong>📅 Date:</strong> ${Details.date || "TBA"}</p>
                        <p style="margin: 8px 0; color: #475569;"><strong>⏰ Time:</strong> ${Details.time || "TBA"}</p>
                        <p style="margin: 8px 0; color: #475569;"><strong>📍 Venue:</strong> ${Details.venue || "TBA"}</p>
                        ${Details.price > 0 ? `<p style="margin: 8px 0; color: #475569;"><strong>💰 Price:</strong> ₦${Details.price}</p>` : '<p style="margin: 8px 0; color: #475569;"><strong>💰 Price:</strong> Free</p>'}
                        <p style="margin: 8px 0; color: #475569;"><strong>🎟️ Ticket:</strong> ${Details.pass}</p>
                    </div>

                    <div style="text-align: center; margin: 25px 0;">
                        <p style="color: #64748b; font-size: 14px; margin-bottom: 12px;">Your Ticket Code</p>
                        <div style="display: inline-block; background: linear-gradient(135deg, #5F57F7 0%, #7C3AED 100%); padding: 15px 25px; border-radius: 10px; font-family: monospace; font-size: 24px; font-weight: bold; color: white; letter-spacing: 3px;">
                            ${Details.pass}
                        </div>
                    </div>

                    ${mapsLink ? `<p style="text-align: center;"><a href="${mapsLink}" target="_blank" style="display: inline-block; padding: 12px 24px; background: #5F57F7; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">📍 Open in Maps</a></p>` : ''}
                    
                    <p style="color: #64748b; font-size: 13px; margin-top: 30px; text-align: center;">
                        Present this code at the event entrance. See you there! 🎊
                    </p>
                </div>
                <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
                    <p>Made with ❤️ by the UniHub Team</p>
                </div>
            </div>
        `,
    };

    transporter.sendMail(mailOptions, function (err, success) {
        if (err) {
            console.log("Ticket email error:", err);
        } else {
            console.log("Ticket email sent successfully");
        }
    });
}

function sendTicketPdf(Details, pdfBuffer) {
    const transporter = createTransporter();
    const baseUrl = process.env.CLIENT_BASE_URL || process.env.CLIENT_URL || "http://localhost:3000";
    const eventLink = Details.event_id ? `${baseUrl}/event/${Details.event_id}` : baseUrl;
    const mapsLink = buildMapsLink(Details);
    const staticImg = buildStaticMapImg(Details);
    
    const userName = Details.name || "there";

    const mailOptions = {
        from: (process.env.NODE_MAILER_USER || "").trim(),
        to: Details.email,
        subject: `🎫 Your UniHub Ticket - ${Details.event_name}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
                <div style="text-align: center; padding: 25px 20px; background: linear-gradient(135deg, #5F57F7 0%, #7C3AED 100%); border-radius: 16px 16px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Ticket Confirmed!</h1>
                </div>
                <div style="background-color: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <p style="color: #475569; font-size: 16px;">
                        Hi <strong style="color: #5F57F7;">${userName}</strong>! 🙌
                    </p>
                    <p style="color: #475569;">Your ticket for <strong>${Details.event_name}</strong> is attached as a PDF.</p>
                    <p style="color: #475569; margin-top: 15px;">Please keep it safe and present it at the event entrance.</p>
                    ${mapsLink ? `<p style="margin-top: 20px;"><a href="${mapsLink}" target="_blank" style="color: #5F57F7;">📍 View Location on Maps</a></p>` : ''}
                </div>
                <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
                    <p>UniHub Team ❤️</p>
                </div>
            </div>
        `,
        attachments: [
            { filename: `${Details.event_name || 'ticket'}.pdf`, content: pdfBuffer },
        ],
    };

    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log("Ticket PDF email error:", err);
        } else {
            console.log("Ticket PDF email sent:", info.response);
        }
    });
}

function sendWhatsAppTicket(Details) {
    try {
        if (!twilioClient) return;
        const from = process.env.TWILIO_WHATSAPP_FROM;
        const toRaw = Details.phone || Details.contactNumber;
        const to = formatWhatsAppPhone(toRaw);
        if (!from || !to) return;
        
        const userName = Details.name || "there";
        const amount = Details.price !== undefined ? Details.price : "";
        const currency = "₦";
        const mapsLink = buildMapsLink(Details);
        
        const body = [
            `🎉 Hey ${userName}! Your ticket is confirmed!`,
            ``,
            `📌 Event: ${Details.event_name}`,
            Details.venue ? `📍 Venue: ${Details.venue}` : null,
            Details.date ? `📅 Date: ${Details.date}` : null,
            Details.time ? `⏰ Time: ${Details.time}` : null,
            ``,
            `🎟️ Your Ticket Code: ${Details.pass}`,
            amount !== "" ? `💰 Amount: ${currency}${amount}` : null,
            ``,
            mapsLink ? `🗺️ Maps: ${mapsLink}` : null,
            `---`,
            `Keep this safe! Present at entry. 🙌`,
        ].filter(Boolean).join("\n");

        twilioClient.messages.create({
            from: `whatsapp:${from}`,
            to: `whatsapp:${to}`,
            body,
        }).catch(e => console.log("WhatsApp error:", e.message));
    } catch (e) {
        console.log("WhatsApp send error:", e);
    }
}

function formatWhatsAppPhone(number) {
    try {
        if (!number) return null;
        let n = String(number).replace(/\s+/g, "");
        if (n.startsWith("whatsapp:")) n = n.replace(/^whatsapp:/, "");
        if (n.startsWith("+")) return n;
        if (n.startsWith("234")) return "+" + n;
        if (n.startsWith("0")) return "+234" + n.slice(1);
        return "+" + n;
    } catch (e) {
        return null;
    }
}

module.exports = {
    sendSMS: (Email, otp) => {
        const transporter = getTransporter();
        const mailOptions = {
            from: (process.env.NODE_MAILER_USER || "").trim(),
            to: Email,
            subject: "🔐 Your UniHub OTP Code",
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; text-align: center; padding: 30px;">
                    <h2 style="color: #5F57F7;">UniHub 🔐</h2>
                    <p>Your verification code:</p>
                    <div style="display: inline-block; background: linear-gradient(135deg, #5F57F7, #7C3AED); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 30px; border-radius: 12px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="color: #64748b; font-size: 13px;">This code expires in 10 minutes. Don't share it! 🚫</p>
                </div>
            `,
        };
        transporter.sendMail(mailOptions, (err) => {
            if (err) console.log("OTP email error:", err);
        });
    },
    sendTicket,
    sendTicketPdf,
    sendWhatsAppTicket,
};