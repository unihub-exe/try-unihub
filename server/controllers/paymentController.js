const { sendTicket, sendTicketPdf, sendWhatsAppTicket } = require("./smsController");
const express = require("express");
const app = express();
const User = require("../models/user");
const { Event } = require("../models/event");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Secrets are now strictly pulled from environment variables
const stripe = require("stripe")(process.env.STRIPE_KEY);
const FLW_KEY = process.env.FLW_SECRET_KEY;

const uuid = require("uuid").v4;

const payment = async(req, res) => {
    let charge, status, check;
    var { product, token, user, event, provider, ticketType, answers, registrationCode, isPremiumUpgrade } = req.body;

    // Handle Premium Upgrade Logic
    if (isPremiumUpgrade) {
        try {
            const ev = await Event.findOne({ event_id: event.event_id });
            if (!ev) return res.status(404).send({ msg: "Event not found" });

            var key = uuid();
            if (provider === "flutterwave" && FLW_KEY) {
                status = "success";
            } else {
                const customer = await stripe.customers.create({
                    email: token.email,
                    source: token.id,
                });

                charge = await stripe.charges.create({
                    amount: product.price * 100,
                    currency: "NGN",
                    customer: customer.id,
                    receipt_email: token.email,
                    description: `Premium Upgrade for ${ev.name}`,
                }, { idempotencyKey: key });
                status = "success";
            }

            if (status === "success") {
                await Event.updateOne({ event_id: event.event_id }, { $set: { isPremium: true } });
                return res.send({ status: "success", msg: "Event upgraded to Premium!" });
            } else {
                return res.status(400).send({ status: "error", msg: "Payment failed" });
            }
        } catch (e) {
            console.log(e);
            return res.status(500).send({ status: "error", msg: "Server error during premium upgrade" });
        }
    }

    try {
        const ev = await Event.findOne({ event_id: event.event_id });

        // Check Token Gating
        if (ev && ev.registrationToken && ev.registrationToken.trim() !== "") {
            if (registrationCode !== ev.registrationToken) {
                return res.send({ status: "invalid_token", msg: "Invalid registration code." });
            }
        }

        if (ev && typeof ev.capacity === "number" && ev.capacity > 0) {
            if (Array.isArray(ev.participants) && ev.participants.length >= ev.capacity) {
                return res.status(400).send({ msg: "Event is full" });
            }
        }
    } catch (e) {
        console.log(e);
    }

    var key = uuid();

    try {
        if (provider === "wallet") {
            const userDoc = await User.findOne({ user_token: user.user_id });
            if (!userDoc) return res.status(401).send({ msg: "User is unauthorized" });
            const priceN = Number(product.price) || 0;
            const balance = (userDoc.wallet && userDoc.wallet.availableBalance) || 0;
            if (balance < priceN) {
                return res.send({ status: "insufficient_funds", msg: "Insufficient wallet balance" });
            }
            await User.updateOne({ user_token: user.user_id }, { $inc: { "wallet.availableBalance": -priceN } });
            status = "success";
        } else if (provider === "flutterwave" && FLW_KEY) {
            status = "success";
        } else {
            const customer = await stripe.customers.create({
                email: token.email,
                source: token.id,
            });

            charge = await stripe.charges.create({
                amount: product.price * 100,
                currency: "NGN",
                customer: customer.id,
                receipt_email: token.email,
                description: `Booked Ticket for ${product.name}`,
                shipping: {
                    name: token.billing_name,
                    address: {
                        line1: token.shipping_address_line1,
                        line2: token.shipping_address_line2,
                        city: token.shipping_address_city,
                        country: token.shipping_address_country,
                        postal_code: token.shipping_address_zip,
                    },
                },
            }, {
                idempotencyKey: key,
            });

            console.log("Charge: ", { charge });
            status = "success";
        }
    } catch (error) {
        console.log(error);
        status = "error";
    }

    // collecting ticket details
    try {
        const docs = await User.find({ user_token: user.user_id });
        if (docs.length !== 0) {
            const ev = await Event.findOne({ event_id: event.event_id });
            var Details = {
                email: docs[0].email,
                event_name: product.name,
                name: token.billing_name,
                pass: key,
                price: product.price,
                address1: token.shipping_address_line1,
                city: token.shipping_address_city,
                zip: token.shipping_address_zip,
                phone: docs[0].contactNumber,
                venue: ev ? ev.venue : undefined,
                date: ev ? ev.date : undefined,
                time: ev ? ev.time : undefined,
                lat: ev && typeof ev.lat === "number" ? ev.lat : undefined,
                lng: ev && typeof ev.lng === "number" ? ev.lng : undefined,
                event_id: event.event_id,
            };

            try {
                const doc = await Event.findOne({
                    event_id: event.event_id,
                    "participants.id": user.user_id,
                });

                if (doc) {
                    check = "alreadyregistered";
                } else {
                    const qrToken = jwt.sign({
                            event_id: event.event_id,
                            user_id: user.user_id,
                            passID: key,
                        },
                        process.env.JWT_SECRET
                    );

                    const updateOps = {
                        $push: {
                            participants: {
                                id: user.user_id,
                                name: docs[0].username,
                                email: docs[0].email,
                                passID: key,
                                regno: docs[0].reg_number,
                                entry: false,
                                qrToken: qrToken,
                                ticketType: ticketType || "General Admission"
                            },
                        },
                    };

                    await Event.updateOne({ event_id: event.event_id }, updateOps);

                    if (global.io) {
                        global.io.emit("participant_updated", { eventId: event.event_id });
                    }
                    if (ticketType) {
                        await Event.updateOne({ event_id: event.event_id, "ticketTypes.name": ticketType }, { $inc: { "ticketTypes.$.sold": 1 } });
                    }
                }
            } catch (err) {
                console.log(err);
            }
            if (check !== "alreadyregistered") {
                sendTicket(Details);
                sendWhatsAppTicket(Details);
            }
        } else {
            status = "error";
            return res.status(401).send({ msg: "User is unauthorized" });
        }
    } catch (err) {
        console.log(err);
    }

    try {
        const events = await Event.find({ event_id: event.event_id });
        if (events.length !== 0) {
            await User.updateOne({ user_token: user.user_id }, { $push: { registeredEvents: events[0] } });
        }
    } catch (err) {
        console.log(err);
    }
    res.send({ status });
};

const freeRegister = async(req, res) => {
    let status;
    var { user, event, ticketType, answers, registrationCode } = req.body;
    const key = uuid();
    try {
        const ev = await Event.findOne({ event_id: event.event_id });
        if (!ev) return res.status(404).send({ msg: "Event not found" });

        if (ev.registrationToken && ev.registrationToken.trim() !== "") {
            if (registrationCode !== ev.registrationToken) {
                return res.send({ status: "invalid_token", msg: "Invalid registration code." });
            }
        }

        const userDoc = await User.findOne({ user_token: user.user_id });
        if (!userDoc) return res.status(401).send({ msg: "User is unauthorized" });

        const isParticipant = ev.participants && ev.participants.some(p => p.id === user.user_id);
        if (isParticipant) {
            return res.send({ status: "alreadyregistered" });
        }

        const isWaitlisted = ev.waitlist && ev.waitlist.some(p => p.userId === user.user_id);
        if (isWaitlisted) {
            return res.send({ status: "waitlisted", msg: "You are already on the waitlist." });
        }

        const isPending = ev.pendingParticipants && ev.pendingParticipants.some(p => p.userId === user.user_id);
        if (isPending) {
            return res.send({ status: "pending", msg: "Your registration is pending approval." });
        }

        if (typeof ev.capacity === "number" && ev.capacity > 0) {
            if (Array.isArray(ev.participants) && ev.participants.length >= ev.capacity) {
                if (ev.waitlistEnabled) {
                    await Event.updateOne({ event_id: event.event_id }, {
                        $push: {
                            waitlist: {
                                userId: user.user_id,
                                name: userDoc.username,
                                email: userDoc.email,
                                date: new Date()
                            }
                        }
                    });
                    return res.send({ status: "success", msg: "Added to waitlist" });
                } else {
                    return res.status(400).send({ msg: "Event is full" });
                }
            }
        }

        if (ev.requiresApproval) {
            await Event.updateOne({ event_id: event.event_id }, {
                $push: {
                    pendingParticipants: {
                        userId: user.user_id,
                        name: userDoc.username,
                        email: userDoc.email,
                        date: new Date(),
                        answers: answers || {},
                        ticketType: ticketType || "Free Ticket",
                        paymentInfo: {}
                    }
                }
            });
            return res.send({ status: "success", msg: "Registration requested. Waiting for approval." });
        }

        const qrToken = jwt.sign({ event_id: event.event_id, user_id: user.user_id, passID: key },
            process.env.JWT_SECRET
        );

        await Event.updateOne({ event_id: event.event_id }, {
            $push: {
                participants: {
                    id: user.user_id,
                    name: userDoc.username,
                    email: userDoc.email,
                    passID: key,
                    regno: userDoc.reg_number,
                    entry: false,
                    qrToken,
                    ticketType: ticketType || "Free Ticket",
                    answers: answers || {}
                },
            },
        });

        if (global.io) {
            global.io.emit("participant_updated", { eventId: event.event_id });
        }

        if (ticketType) {
            await Event.updateOne({ event_id: event.event_id, "ticketTypes.name": ticketType }, { $inc: { "ticketTypes.$.sold": 1 } });
        }

        const evAfter = await Event.findOne({ event_id: event.event_id });
        if (evAfter) {
            await User.updateOne({ user_token: user.user_id }, { $push: { registeredEvents: evAfter } });
        }

        try {
            const PDFDocument = require("pdfkit");
            const QRCode = require("qrcode");
            const doc = new PDFDocument({ size: "A4", margin: 50 });
            const chunks = [];
            doc.on("data", (c) => chunks.push(c));
            doc.on("end", async() => {
                const pdfBuffer = Buffer.concat(chunks);
                const Details = {
                    email: userDoc.email,
                    event_name: ev.name,
                    name: userDoc.username,
                    pass: key,
                    price: 0,
                    phone: userDoc.contactNumber,
                    venue: ev.venue,
                    date: ev.date,
                    time: ev.time,
                    lat: typeof ev.lat === "number" ? ev.lat : undefined,
                    lng: typeof ev.lng === "number" ? ev.lng : undefined,
                    event_id: event.event_id,
                };
                await sendTicketPdf(Details, pdfBuffer);
                sendWhatsAppTicket(Details);
            });
            doc.fontSize(20).text("UniHub Event Ticket", { align: "center" });
            doc.moveDown();
            doc.fontSize(14).text(`Event: ${ev.name}`);
            doc.text(`Venue: ${ev.venue}`);
            doc.text(`Date: ${ev.date}`);
            doc.text(`Time: ${ev.time}`);
            doc.text(`Name: ${userDoc.username}`);
            doc.text(`Pass: ${key}`);
            doc.moveDown();
            const qrData = qrToken;
            const qrPng = await QRCode.toDataURL(qrData);
            const base64Data = qrPng.replace(/^data:image\/png;base64,/, "");
            const qrBuffer = Buffer.from(base64Data, "base64");
            doc.image(qrBuffer, { fit: [200, 200], align: "center" });
            doc.end();
        } catch (libErr) {
            const Details = {
                email: userDoc.email,
                event_name: ev.name,
                name: userDoc.username,
                pass: key,
                price: 0,
                phone: userDoc.contactNumber,
                venue: ev.venue,
                date: ev.date,
                time: ev.time,
                lat: typeof ev.lat === "number" ? ev.lat : undefined,
                lng: typeof ev.lng === "number" ? ev.lng : undefined,
                event_id: event.event_id,
            };
            sendTicket(Details);
            sendWhatsAppTicket(Details);
        }

        status = "success";
        return res.send({ status });
    } catch (e) {
        console.log(e);
        return res.status(400).send({ msg: "Error registering" });
    }
};


const cancelRegistration = async(req, res) => {
    try {
        const { user, event } = req.body;
        if (!user || !user.user_id || !event || !event.event_id) {
            return res.status(400).send({ msg: "Invalid request" });
        }

        const ev = await Event.findOne({ event_id: event.event_id });
        if (!ev) return res.status(404).send({ msg: "Event not found" });

        const exists = await Event.findOne({ event_id: event.event_id, "participants.id": user.user_id });
        if (!exists) return res.send({ status: "notregistered" });

        await Event.updateOne({ event_id: event.event_id }, { $pull: { participants: { id: user.user_id } } });

        if (global.io) {
            global.io.emit("participant_updated", { eventId: event.event_id });
        }

        await User.updateOne({ user_token: user.user_id }, { $pull: { registeredEvents: { event_id: event.event_id } } });

        return res.send({ status: "success" });
    } catch (e) {
        console.log(e);
        return res.status(400).send({ msg: "Error cancelling" });
    }
};

const fundWallet = async(req, res) => {
    try {
        const userToken = req.body.user_token || (req.user && req.user.user_token);
        const { amount, provider, token } = req.body;
        const amt = Number(amount);
        if (!userToken) return res.status(400).send({ msg: "Missing user token" });
        if (!amt || amt <= 0) return res.status(400).send({ msg: "Invalid amount" });

        if (provider === "stripe" && token) {
            const key = uuid();
            try {
                const customer = await stripe.customers.create({
                    email: token.email,
                    source: token.id,
                });
                await stripe.charges.create({
                    amount: Math.round(amt * 100),
                    currency: "NGN",
                    customer: customer.id,
                    receipt_email: token.email,
                    description: `Wallet funding ₦${amt}`,
                }, { idempotencyKey: key });
            } catch (err) {
                return res.status(400).send({ msg: "Card charge failed" });
            }
        }

        await User.updateOne({ user_token: userToken }, { $inc: { "wallet.availableBalance": amt } });
        const updated = await User.findOne({ user_token: userToken }).select("wallet");
        res.send({ msg: "Wallet funded", wallet: updated.wallet });
    } catch (e) {
        res.status(500).send({ msg: "Error funding wallet" });
    }
};

const createWalletFundSession = async(req, res) => {
    try {
        const userToken = req.body.user_token || (req.user && req.user.user_token);
        const { amount } = req.body;
        const amt = Number(amount);
        if (!userToken) return res.status(400).send({ msg: "Missing user token" });
        if (!amt || amt <= 0) return res.status(400).send({ msg: "Invalid amount" });

        const origin = req.headers.origin;
        const baseUrl = origin || process.env.CLIENT_BASE_URL || process.env.CLIENT_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: "ngn",
                    product_data: { name: "Wallet Funding" },
                    unit_amount: Math.round(amt * 100),
                },
                quantity: 1,
            }, ],
            success_url: `${baseUrl}/users/wallet?status=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/users/wallet?status=cancel`,
            metadata: {
                user_token: userToken,
                amount: String(amt),
            },
        });

        res.send({ url: session.url });
    } catch (e) {
        res.status(500).send({ msg: "Failed to create checkout session" });
    }
};

const confirmWalletFund = async(req, res) => {
    try {
        const { session_id } = req.body;
        if (!session_id) return res.status(400).send({ msg: "Missing session_id" });

        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (!session) return res.status(404).send({ msg: "Session not found" });
        if (session.payment_status !== "paid") {
            return res.status(400).send({ msg: "Payment not completed" });
        }

        const metaUserToken = session.metadata && session.metadata.user_token;
        const metaAmount = session.metadata && Number(session.metadata.amount);
        if (!metaUserToken || !metaAmount || metaAmount <= 0) {
            return res.status(400).send({ msg: "Invalid session metadata" });
        }

        await User.updateOne({ user_token: metaUserToken }, { $inc: { "wallet.availableBalance": metaAmount } });
        const updated = await User.findOne({ user_token: metaUserToken }).select("wallet");
        res.send({ msg: "Wallet funded", wallet: updated.wallet });
    } catch (e) {
        res.status(500).send({ msg: "Failed to confirm funding" });
    }
};

module.exports = {
    payment,
    freeRegister,
    cancelRegistration,
    fundWallet,
    createWalletFundSession,
    confirmWalletFund,
};