const PayoutRequest = require("../models/PayoutRequest");
const User = require("../models/user");
const Transaction = require("../models/Transaction");
const { createNotification } = require("./notificationController");
const { sendPayoutStatusEmail } = require("../utils/emailService");

// Get all payout requests
exports.getAllPayouts = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        
        const payouts = await PayoutRequest.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        // Enrich with user details
        const enrichedPayouts = await Promise.all(
            payouts.map(async (payout) => {
                const user = await User.findOne({ user_token: payout.userId });
                return {
                    ...payout,
                    userName: user?.displayName || user?.username || 'Unknown',
                    userEmail: user?.email || 'N/A'
                };
            })
        );

        res.send(enrichedPayouts);
    } catch (error) {
        console.error("Get payouts error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

// Approve payout (immediate or scheduled)
exports.approvePayout = async (req, res) => {
    try {
        const { payoutId, immediate } = req.body;
        const adminId = req.user?.user_token;

        const payout = await PayoutRequest.findById(payoutId);
        if (!payout) {
            return res.status(404).send({ msg: "Payout request not found" });
        }

        if (payout.status !== 'pending') {
            return res.status(400).send({ msg: "Payout already processed" });
        }

        // Update payout status
        payout.status = 'approved';
        payout.approvedBy = adminId;
        payout.approvedAt = new Date();
        payout.immediate = immediate || false;
        await payout.save();

        // Get user details
        const user = await User.findOne({ user_token: payout.userId });
        if (!user) {
            return res.status(404).send({ msg: "User not found" });
        }

        // If immediate, process transfer now
        if (immediate) {
            try {
                // TODO: Integrate with Paystack Transfer API
                // const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);
                // const transfer = await paystack.transfer.create({
                //     source: "balance",
                //     amount: payout.amount * 100, // Convert to kobo
                //     recipient: payout.recipientCode,
                //     reason: `Payout from UniHub - ${payout.reference}`
                // });

                payout.status = 'completed';
                payout.completedAt = new Date();
                await payout.save();

                // Create transaction record
                await Transaction.create({
                    userId: payout.userId,
                    type: 'payout',
                    amount: -payout.amount,
                    description: `Payout to ${payout.bankName} - ${payout.accountNumber}`,
                    status: 'completed',
                    reference: payout.reference
                });

                console.log(`Immediate payout processed for ${user.email}`);
            } catch (transferError) {
                console.error("Transfer error:", transferError);
                payout.status = 'failed';
                payout.failureReason = transferError.message;
                await payout.save();
                
                return res.status(500).send({ msg: "Transfer failed", error: transferError.message });
            }
        }

        // Notify user
        await createNotification(
            payout.userId,
            'payout_approved',
            'Payout Approved',
            immediate 
                ? `Your payout of ₦${payout.amount.toLocaleString()} has been processed and will arrive in your bank account within 24 hours.`
                : `Your payout of ₦${payout.amount.toLocaleString()} has been approved and will be processed within 48 hours.`,
            '/users/wallet'
        );

        // Send email
        try {
            await sendPayoutStatusEmail({
                email: user.email,
                name: user.displayName || user.username,
                amount: payout.amount,
                status: 'approved'
            });
        } catch (emailError) {
            console.error("Email error:", emailError);
        }

        res.send({ 
            msg: immediate ? "Payout processed immediately" : "Payout approved", 
            payout 
        });
    } catch (error) {
        console.error("Approve payout error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

// Reject payout
exports.rejectPayout = async (req, res) => {
    try {
        const { payoutId, reason } = req.body;
        const adminId = req.user?.user_token;

        const payout = await PayoutRequest.findById(payoutId);
        if (!payout) {
            return res.status(404).send({ msg: "Payout request not found" });
        }

        if (payout.status !== 'pending') {
            return res.status(400).send({ msg: "Payout already processed" });
        }

        // Update payout status
        payout.status = 'rejected';
        payout.rejectedBy = adminId;
        payout.rejectedAt = new Date();
        payout.rejectionReason = reason || 'No reason provided';
        await payout.save();

        // Return funds to user's available balance
        const user = await User.findOne({ user_token: payout.userId });
        if (user) {
            user.wallet.availableBalance += payout.amount;
            await user.save();

            // Create transaction record
            await Transaction.create({
                userId: payout.userId,
                type: 'payout_rejected',
                amount: payout.amount,
                description: `Payout rejected - Funds returned to wallet`,
                status: 'completed',
                reference: payout.reference
            });

            // Notify user
            await createNotification(
                payout.userId,
                'payout_rejected',
                'Payout Rejected',
                `Your payout request of ₦${payout.amount.toLocaleString()} has been rejected. ${reason || 'Please contact support for more information.'}`,
                '/users/wallet'
            );

            // Send email
            try {
                await sendPayoutStatusEmail({
                    email: user.email,
                    name: user.displayName || user.username,
                    amount: payout.amount,
                    status: 'rejected',
                    reason: reason || 'Please contact support for more information.'
                });
            } catch (emailError) {
                console.error("Email error:", emailError);
            }
        }

        res.send({ msg: "Payout rejected", payout });
    } catch (error) {
        console.error("Reject payout error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

module.exports = exports;
