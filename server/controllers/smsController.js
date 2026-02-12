const nodemailer = require("nodemailer");
const { createTransporter } = require("../utils/emailService");
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

function sendSMS(Email, otp) {
    const transporter = createTransporter();

    let mailOptions = {
        from: (process.env.NODE_MAILER_USER || "").trim(),
        to: Email,
        subject: "One Time Password - UniHub",
        html: `Please keep your OTP confidential and do not share it with anyone. The OTP will be valid for five minutes only. <br><strong>OTP: ${otp}</strong><br><br>Thank you for choosing UniHub!`,
    };

    transporter.sendMail(mailOptions, function (err, success) {
        if (err) {
            console.log(err);
        } else {
            console.log("Email sent successfully");
        }
    });
}

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
    let mailOptions = {
        from: (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.NODE_MAILER_USER || "").trim(),
        to: Details.email,
        subject: `Your Online Event Pass for ${Details.event_name} - UniHub✨`,
        html: `Dear <i>${Details.name}</i>,<br><br>Thank you for registering for ${Details.event_name}! Your online pass is ready.<br><br><strong>Pass Number: ${Details.pass}</strong><br>Amount Paid: ${Details.price}<br>${Details.venue ? `Venue: ${Details.venue}<br>` : ""}${Details.date ? `Date: ${Details.date}<br>` : ""}${Details.time ? `Time: ${Details.time}<br>` : ""}${Details.address1 ? `Address: ${Details.address1}<br>` : ""}${Details.city ? `City: ${Details.city}<br>` : ""}${Details.zip ? `PinCode: ${Details.zip}<br>` : ""}<br>${mapsLink ? `<a href="${mapsLink}" target="_blank">Open Location in Google Maps</a><br>` : ""}${staticImg ? `<br><img src="${staticImg}" alt="Event location" style="border-radius:8px;max-width:100%;height:auto"/>` : ""}<br><br><a href="${eventLink}" target="_blank">Open Event Page</a><br><br>Best regards,<br>The UniHub Team`,
    };

    transporter.sendMail(mailOptions, function (err, success) {
        if (err) {
            console.log(err);
        } else {
            console.log("Email sent successfully");
        }
    });
}

function sendTestMailHandler(req, res) {
    try {
        const to = req.body.to || process.env.SMTP_USER || process.env.NODE_MAILER_USER;
        const transporter = getTransporter();

        let mailOptions = {
            from: (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.NODE_MAILER_USER || "").trim(),
            to,
            subject: "UniHub Mailer Test",
            html: `This is a test email from UniHub mailer at ${new Date().toISOString()}.`,
        };

        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.log("Mailer error:", err);
                return res.status(500).send({ ok: false, error: String(err) });
            } else {
                console.log("Test email sent:", info.response);
                return res.status(200).send({ ok: true });
            }
        });
    } catch (e) {
        return res.status(500).send({ ok: false, error: String(e) });
    }
}

async function sendTicketPdf(Details, pdfBuffer) {
    try {
        const transporter = createTransporter();

        const baseUrl = process.env.CLIENT_BASE_URL || process.env.CLIENT_URL || "http://localhost:3000";
        const eventLink = Details.event_id ? `${baseUrl}/event/${Details.event_id}` : baseUrl;
        const mapsLink = buildMapsLink(Details);
        const staticImg = buildStaticMapImg(Details);
        const mailOptions = {
            from: (process.env.NODE_MAILER_USER || "").trim(),
            to: Details.email,
            subject: `Your Online Event Pass for ${Details.event_name} - UniHub✨`,
            html: `Dear <i>${Details.name}</i>,<br><br>Your online pass for <b>${Details.event_name}</b> is attached as a PDF. Please keep it safe and do not share it.<br><br>${mapsLink ? `<a href="${mapsLink}" target="_blank">Open Location in Google Maps</a><br>` : ""}${staticImg ? `<br><img src="${staticImg}" alt="Event location" style="border-radius:8px;max-width:100%;height:auto"/>` : ""}<br><br><a href="${eventLink}" target="_blank">Open Event Page</a><br><br>Best regards,<br>The UniHub Team`,
            attachments: [
                { filename: "ticket.pdf", content: pdfBuffer },
            ],
        };

        await transporter.sendMail(mailOptions);
        console.log("Ticket PDF email sent successfully");
    } catch (e) {
        console.log(e);
    }
}

module.exports = {
    sendSMS,
    sendTicket,
    sendTestMailHandler,
    sendTicketPdf,
    sendWhatsAppTicket,
};

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

async function sendWhatsAppTicket(Details) {
    try {
        if (!twilioClient) return;
        const from = process.env.TWILIO_WHATSAPP_FROM;
        const toRaw = Details.phone || Details.contactNumber;
        const to = formatWhatsAppPhone(toRaw);
        if (!from || !to) return;
        const amount = Details.price !== undefined ? Details.price : "";
        const currency = "₦";
        const mapsLink = buildMapsLink(Details);
        const body = [
            `Hello ${Details.name}, your ticket is confirmed!`,
            `Event: ${Details.event_name}`,
            Details.venue ? `Venue: ${Details.venue}` : null,
            Details.date ? `Date: ${Details.date}` : null,
            Details.time ? `Time: ${Details.time}` : null,
            `Pass: ${Details.pass}`,
            amount !== "" ? `Amount: ${currency}${amount}` : null,
            mapsLink ? `Map: ${mapsLink}` : null,
            `Keep this pass safe. Present the QR/pass at entry.`,
        ]
            .filter(Boolean)
            .join("\n");

        await twilioClient.messages.create({
            from: `whatsapp:${from}`,
            to: `whatsapp:${to}`,
            body,
        });
    } catch (e) {
        console.log("Twilio WhatsApp error:", e);
    }
}
