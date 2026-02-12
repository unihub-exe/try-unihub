const { PKPass } = require("passkit-generator");
const { Event } = require("../models/event");
const User = require("../models/user");
const path = require("path");
const fs = require("fs");

const generatePass = async (req, res) => {
    try {
        // Support both POST (body) and GET (query) for download links
        const event_id = req.body.event_id || req.query.event_id;
        const user_token = req.body.user_token || req.query.user_token;

        if (!event_id || !user_token) {
            return res.status(400).send({ msg: "Missing event_id or user_token" });
        }
        
        const event = await Event.findOne({ event_id });
        if (!event) return res.status(404).send({ msg: "Event not found" });

        const user = await User.findOne({ user_token });
        if (!user) return res.status(404).send({ msg: "User not found" });

        const participant = event.participants.find(p => p.id === user_token);
        if (!participant) return res.status(403).send({ msg: "Not registered" });

        // Check for certificates
        const certsDir = path.join(__dirname, "../certs");
        const wwdrPath = path.join(certsDir, "wwdr.pem");
        const signerCertPath = path.join(certsDir, "signerCert.pem");
        const signerKeyPath = path.join(certsDir, "signerKey.pem");

        if (!fs.existsSync(wwdrPath) || !fs.existsSync(signerCertPath) || !fs.existsSync(signerKeyPath)) {
            console.warn("Apple Wallet certificates missing in server/certs/");
            return res.status(501).send({ 
                msg: "Apple Wallet not configured. Please add wwdr.pem, signerCert.pem, and signerKey.pem to server/certs/" 
            });
        }

        try {
            // Create a pass
            const pass = new PKPass({}, {
                wwdr: fs.readFileSync(wwdrPath),
                signerCert: fs.readFileSync(signerCertPath),
                signerKey: fs.readFileSync(signerKeyPath),
            });

            pass.type = "eventTicket";
            pass.primaryFields.add({
                key: "event",
                label: "EVENT",
                value: event.name,
            });

            pass.secondaryFields.add({
                key: "loc",
                label: "LOCATION",
                value: event.venue,
            });
            
            pass.secondaryFields.add({
                key: "date",
                label: "DATE",
                value: `${event.date} ${event.time}`,
            });

            pass.auxiliaryFields.add({
                key: "name",
                label: "ATTENDEE",
                value: participant.name,
            });
            
            pass.auxiliaryFields.add({
                key: "ticket",
                label: "TICKET TYPE",
                value: participant.ticketType || "General",
            });

            pass.barcode = {
                format: "PKBarcodeFormatQR",
                message: participant.qrToken || participant.passID,
                messageEncoding: "iso-8859-1",
            };
            
            // Set colors (using InVITe colors if possible, else defaults)
            pass.backgroundColor = "rgb(60, 65, 150)"; // Example primary color
            pass.foregroundColor = "rgb(255, 255, 255)";

            const buffer = pass.getAsBuffer();
            res.set("Content-Type", "application/vnd.apple.pkpass");
            res.set("Content-Disposition", `attachment; filename=${event.name.replace(/[^a-z0-9]/gi, '_')}.pkpass`);
            res.send(buffer);

        } catch (err) {
            console.error("Pass generation error:", err);
            res.status(500).send({ msg: "Failed to generate pass logic", error: err.message });
        }

    } catch (e) {
        console.log(e);
        res.status(500).send({ msg: "Server error" });
    }
};

module.exports = { generatePass };
