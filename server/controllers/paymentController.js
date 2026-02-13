const { sendTicket, sendTicketPdf, sendWhatsAppTicket } = require("./smsController");
const { sendTicketEmail } = require("../utils/emailService");
const express = require("express");
const app = express();
const User = require("../models/user");
const { Event } = require("../models/event");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Paystack Configuration
const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);

// Generate unique reference for transactions
const generateReference = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `unihub_${timestamp}_${randomStr}`;
};

// Verify Paystack transaction
const verifyPaystackPayment = async(reference) => {
    try {
        const response = await paystack.transaction.verify({ reference });
        return response.data;
    } catch (error) {
        console.error("Paystack verification error:", error);
        return null;
    }
};

// Create Paystack transfer recipient
const createTransferRecipient = async(accountNumber, bankCode, accountName) => {
    try {
        const response = await paystack.transferRecipient.create({
            type: "nuban",
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: "NGN"
        });
        return response.data;
    } catch (error) {
        console.error("Paystack transfer recipient error:", error);
        return null;
    }
};

// Initiate transfer to user
const initiateTransfer = async(amount, recipientCode, reason) => {
    try {
        const response = await paystack.transfer.initiate({
            source: "balance",
            amount: amount * 100, // Convert to kobo
            recipient: recipientCode,
            reason: reason
        });
        return response.data;
    } catch (error) {
        console.error("Paystack transfer error:", error);
        return null;
    }
};

const payment = async(req, res) => {
    let charge, status, check;
    var { product, token, user, event, provider, ticketType, answers, registrationCode, isPremiumUpgrade, paystackReference } = req.body;

    // Handle Premium Upgrade Logic with Paystack
    if (isPremiumUpgrade) {
        try {
            const ev = await Event.findOne({ event_id: event.event_id });
            if (!ev) return res.status(404).send({ msg: "Event not found" });

            // Verify Paystack payment if reference provided
            if (paystackReference) {
                const verification = await verifyPaystackPayment(paystackReference);
                if (verification && verification.status === "success") {
                    status = "success";
                } else {
                    return res.status(400).send({ status: "error", msg: "Payment verification failed" });
                }
            } else {
                // For direct payment, we'll use inline Paystack checkout
                return res.status(400).send({ status: "error", msg: "Payment reference required" });
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

    // Validate event exists and has capacity
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

    var key = uuid ? uuid.v4() : require("uuid").v4();
    const transactionId = generateReference();

    try {
        if (provider === "wallet") {
            const userDoc = await User.findOne({ user_token: user.user_id });
            if (!userDoc) return res.status(401).send({ msg: "User is unauthorized" });
            const priceN = Number(product.price) || 0;
            const balance = (userDoc.wallet && userDoc.wallet.availableBalance) || 0;
            if (balance < priceN) {
                return res.send({ status: "insufficient_funds", msg: "Insufficient wallet balance" });
            }

            // Record transaction for regular users
            await User.updateOne({ user_token: user.user_id }, {
                $inc: { "wallet.availableBalance": -priceN },
                $push: {
                    transactions: {
                        type: "debit",
                        amount: priceN,
                        description: `Ticket: ${product.name}`,
                        eventId: event.event_id,
                        transactionId: transactionId,
                        date: new Date(),
                        status: "completed"
                    }
                }
            });
            status = "success";
        } else if (provider === "paystack" && paystackReference) {
            // Verify Paystack payment
            const verification = await verifyPaystackPayment(paystackReference);
            if (verification && verification.status === "success") {
                status = "success";
            } else {
                return res.status(400).send({ status: "error", msg: "Payment verification failed" });
            }
        } else {
            // Fallback to wallet or error
            return res.status(400).send({ status: "error", msg: "Invalid payment provider" });
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
                name: (token && token.billing_name) || docs[0].username,
                pass: key,
                price: product.price,
                address1: (token && token.shipping_address_line1),
                city: (token && token.shipping_address_city),
                zip: (token && token.shipping_address_zip),
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
                // Send old format ticket (keep for compatibility)
                sendTicket(Details);
                sendWhatsAppTicket(Details);
                
                // Send new PDF ticket with QR code
                try {
                    await sendTicketEmail({
                        email: docs[0].email,
                        name: docs[0].username || docs[0].displayName,
                        eventName: ev.name,
                        eventDate: ev.date,
                        eventTime: ev.time,
                        eventVenue: ev.venue,
                        ticketType: ticketType || "General Admission",
                        price: product.price,
                        ticketId: key,
                        eventId: event.event_id,
                        userId: user.user_id
                    });
                    console.log("PDF ticket sent successfully");
                } catch (emailError) {
                    console.error("Error sending PDF ticket:", emailError);
                    // Don't fail the whole transaction if email fails
                }
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
    res.send({ status, transactionId });
};

const freeRegister = async(req, res) => {
    let status;
    var { user, event, ticketType, answers, registrationCode } = req.body;
    const key = require("uuid").v4();
    const transactionId = generateReference();
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

        // Record free registration in transactions
        await User.updateOne({ user_token: user.user_id }, {
            $push: {
                transactions: {
                    type: "free",
                    amount: 0,
                    description: `Free Registration: ${ev.name}`,
                    eventId: event.event_id,
                    transactionId: transactionId,
                    date: new Date(),
                    status: "completed"
                }
            }
        });

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
        return res.send({ status, transactionId });
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

// Initialize Paystack payment for wallet funding
const initializePaystackPayment = async(req, res) => {
    try {
        const { email, amount, user_token } = req.body;
        const amt = Number(amount);

        if (!email || !amt || amt <= 0) {
            return res.status(400).send({ msg: "Invalid parameters" });
        }

        const reference = generateReference();

        // Create Paystack checkout session
        const response = await paystack.transaction.initialize({
            email: email,
            amount: amt * 100, // Convert to kobo
            reference: reference,
            metadata: {
                user_token: user_token,
                purpose: "wallet_funding"
            },
            callback_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/users/wallet?status=success&reference=${reference}`
        });

        if (response.status) {
            res.send({
                authorizationUrl: response.data.authorization_url,
                reference: reference
            });
        } else {
            res.status(400).send({ msg: "Failed to initialize payment" });
        }
    } catch (error) {
        console.error("Paystack initialization error:", error);
        res.status(500).send({ msg: "Payment initialization failed" });
    }
};

// Verify and complete wallet funding
const verifyWalletFunding = async(req, res) => {
    try {
        const { reference } = req.body;
        if (!reference) return res.status(400).send({ msg: "Missing reference" });

        const verification = await verifyPaystackPayment(reference);

        if (verification && verification.status === "success") {
            const metadata = verification.metadata || {};
            const user_token = metadata.user_token;
            const amount = verification.amount / 100; // Convert from kobo

            if (!user_token) {
                return res.status(400).send({ msg: "User token missing in transaction" });
            }

            // Update user wallet with transaction record
            await User.updateOne({ user_token }, {
                $inc: { "wallet.availableBalance": amount },
                $push: {
                    transactions: {
                        type: "credit",
                        amount: amount,
                        description: "Wallet Funding",
                        paymentReference: reference,
                        date: new Date(),
                        status: "completed"
                    }
                }
            });

            const updated = await User.findOne({ user_token }).select("wallet");
            res.send({ msg: "Wallet funded successfully", wallet: updated.wallet });
        } else {
            res.status(400).send({ msg: "Payment verification failed" });
        }
    } catch (error) {
        console.error("Wallet funding verification error:", error);
        res.status(500).send({ msg: "Verification failed" });
    }
};

// Get user transactions
const getTransactions = async(req, res) => {
    try {
        const user_token = req.body.user_token || (req.user && req.user.user_token);
        if (!user_token) return res.status(400).send({ msg: "Missing user token" });

        const user = await User.findOne({ user_token }).select("transactions");
        if (!user) return res.status(404).send({ msg: "User not found" });

        // Return last 50 transactions, sorted by date descending
        const transactions = (user.transactions || [])
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 50);

        res.send({ transactions });
    } catch (error) {
        console.error("Get transactions error:", error);
        res.status(500).send({ msg: "Error fetching transactions" });
    }
};

// Organizer withdrawal request
const requestWithdrawal = async(req, res) => {
    try {
        const user_token = req.body.user_token || (req.user && req.user.user_token);
        const { amount, accountNumber, bankCode, accountName } = req.body;

        if (!user_token) return res.status(400).send({ msg: "Missing user token" });
        if (!amount || Number(amount) <= 0) return res.status(400).send({ msg: "Invalid amount" });
        if (!accountNumber || !bankCode || !accountName) {
            return res.status(400).send({ msg: "Missing bank details" });
        }

        const user = await User.findOne({ user_token });
        if (!user) return res.status(404).send({ msg: "User not found" });

        // Security check: Minimum withdrawal amount
        const minWithdrawal = 1000; // ₦1000
        if (Number(amount) < minWithdrawal) {
            return res.status(400).send({ msg: `Minimum withdrawal is ₦${minWithdrawal}` });
        }

        // Check available balance
        const availableBalance = (user.wallet && user.wallet.availableBalance) || 0;
        if (Number(amount) > availableBalance) {
            return res.status(400).send({ msg: "Insufficient balance for withdrawal" });
        }

        // Security: Validate bank code format
        const validBankCodes = [
            "044", "050", "011", "082", "214", "215", "221", "232", "301", "302",
            "303", "305", "307", "308", "309", "314", "315", "317", "323", "324"
        ];
        if (!validBankCodes.includes(bankCode)) {
            return res.status(400).send({ msg: "Invalid bank code" });
        }

        // Generate withdrawal reference
        const withdrawalReference = generateReference();

        // Create transfer recipient in Paystack
        const recipient = await createTransferRecipient(accountNumber, bankCode, accountName);
        if (!recipient) {
            return res.status(500).send({ msg: "Failed to create transfer recipient" });
        }

        // Deduct from balance and create pending withdrawal record
        await User.updateOne({ user_token }, {
            $inc: { "wallet.availableBalance": -Number(amount) },
            $push: {
                withdrawals: {
                    reference: withdrawalReference,
                    amount: Number(amount),
                    recipientCode: recipient.recipient_code,
                    accountNumber: accountNumber,
                    bankCode: bankCode,
                    accountName: accountName,
                    status: "pending",
                    createdAt: new Date()
                }
            }
        });

        // Initiate transfer
        const transfer = await initiateTransfer(Number(amount), recipient.recipient_code, `Withdrawal from UniHub - ${withdrawalReference}`);

        if (transfer && transfer.status === "success") {
            // Update withdrawal status to processing
            await User.updateOne({
                user_token,
                "withdrawals.reference": withdrawalReference
            }, {
                $set: { "withdrawals.$.status": "processing", "withdrawals.$.transferId": transfer.data.id }
            });

            res.send({
                msg: "Withdrawal initiated successfully",
                reference: withdrawalReference,
                status: "processing"
            });
        } else {
            // Revert the deduction if transfer failed
            await User.updateOne({ user_token }, {
                $inc: { "wallet.availableBalance": Number(amount) },
                $set: { "withdrawals.$.status": "failed" }
            });
            res.status(500).send({ msg: "Failed to initiate transfer" });
        }
    } catch (error) {
        console.error("Withdrawal error:", error);
        res.status(500).send({ msg: "Withdrawal request failed" });
    }
};

// Get withdrawal history
const getWithdrawalHistory = async(req, res) => {
    try {
        const user_token = req.body.user_token || (req.user && req.user.user_token);
        if (!user_token) return res.status(400).send({ msg: "Missing user token" });

        const user = await User.findOne({ user_token }).select("withdrawals wallet");
        if (!user) return res.status(404).send({ msg: "User not found" });

        const withdrawals = (user.withdrawals || [])
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 50);

        res.send({
            withdrawals,
            availableBalance: (user.wallet && user.wallet.availableBalance) || 0
        });
    } catch (error) {
        console.error("Get withdrawals error:", error);
        res.status(500).send({ msg: "Error fetching withdrawals" });
    }
};

// Webhook for Paystack (for production use)
const paystackWebhook = async(req, res) => {
    const hash = require("crypto").createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
        return res.status(401).send({ msg: "Invalid signature" });
    }

    const event = req.body;

    if (event.event === "charge.success") {
        const metadata = event.data.metadata || {};
        if (metadata.purpose === "wallet_funding") {
            const user_token = metadata.user_token;
            const amount = event.data.amount / 100;

            await User.updateOne({ user_token }, {
                $inc: { "wallet.availableBalance": amount },
                $push: {
                    transactions: {
                        type: "credit",
                        amount: amount,
                        description: "Wallet Funding (Webhook)",
                        paymentReference: event.data.reference,
                        date: new Date(),
                        status: "completed"
                    }
                }
            });
        }
    }

    res.send({ msg: "Webhook received" });
};

const fundWallet = async(req, res) => {
    // Legacy function - now redirects to Paystack
    const userToken = req.body.user_token || (req.user && req.user.user_token);
    const { amount, provider } = req.body;
    const amt = Number(amount);

    if (!userToken) return res.status(400).send({ msg: "Missing user token" });
    if (!amt || amt <= 0) return res.status(400).send({ msg: "Invalid amount" });

    try {
        const user = await User.findOne({ user_token: userToken });
        if (!user) return res.status(404).send({ msg: "User not found" });

        // Initialize Paystack payment
        const response = await paystack.transaction.initialize({
            email: user.email,
            amount: amt * 100,
            reference: generateReference(),
            metadata: {
                user_token: userToken,
                purpose: "wallet_funding"
            },
            callback_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/users/wallet?status=success`
        });

        if (response.status) {
            res.send({
                url: response.data.authorization_url,
                reference: response.data.reference
            });
        } else {
            res.status(400).send({ msg: "Failed to initialize payment" });
        }
    } catch (e) {
        console.error("Fund wallet error:", e);
        res.status(500).send({ msg: "Error funding wallet" });
    }
};

module.exports = {
    payment,
    freeRegister,
    cancelRegistration,
    fundWallet,
    initializePaystackPayment,
    verifyWalletFunding,
    getTransactions,
    requestWithdrawal,
    getWithdrawalHistory,
    paystackWebhook
};