const User = require("../models/user");
const Transaction = require("../models/Transaction");
const PayoutRequest = require("../models/PayoutRequest");
const Event = require("../models/event");
const { createNotification } = require("./notificationController");

// Get wallet details
exports.getWallet = async (req, res) => {
    try {
        const userId = req.body.user_token || req.user?.user_token;
        
        const user = await User.findOne({ user_token: userId });
        if (!user) {
            return res.status(404).send({ msg: "User not found" });
        }

        // Get recent transactions
        const transactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);

        // Calculate analytics
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const monthlyTransactions = await Transaction.find({
            userId,
            createdAt: { $gte: last30Days }
        });

        const analytics = {
            totalIncome: monthlyTransactions
                .filter(t => ['ticket_sale', 'deposit'].includes(t.type))
                .reduce((sum, t) => sum + t.amount, 0),
            totalExpenses: monthlyTransactions
                .filter(t => ['ticket_purchase', 'withdrawal', 'premium_payment'].includes(t.type))
                .reduce((sum, t) => sum + t.amount, 0),
            ticketSales: monthlyTransactions
                .filter(t => t.type === 'ticket_sale').length,
            ticketPurchases: monthlyTransactions
                .filter(t => t.type === 'ticket_purchase').length
        };

        res.send({
            wallet: user.wallet,
            transactions,
            analytics,
            role: user.role
        });
    } catch (error) {
        console.error("Get wallet error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

// Update bank details
exports.updateBankDetails = async (req, res) => {
    try {
        const userId = req.body.user_token || req.user?.user_token;
        const { accountNumber, accountName, bankCode, bankName } = req.body;

        const user = await User.findOne({ user_token: userId });
        if (!user) {
            return res.status(404).send({ msg: "User not found" });
        }

        user.wallet.bankDetails = {
            accountNumber,
            accountName,
            bankCode,
            bankName
        };

        await user.save();

        res.send({ msg: "Bank details updated successfully", bankDetails: user.wallet.bankDetails });
    } catch (error) {
        console.error("Update bank details error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

// Request payout
exports.requestPayout = async (req, res) => {
    try {
        const userId = req.body.user_token || req.user?.user_token;
        const { amount } = req.body;

        const user = await User.findOne({ user_token: userId });
        if (!user) {
            return res.status(404).send({ msg: "User not found" });
        }

        // Check if user has bank details
        if (!user.wallet.bankDetails?.accountNumber) {
            return res.status(400).send({ msg: "Please add your bank details first" });
        }

        // Check available balance
        if (amount > user.wallet.availableBalance) {
            return res.status(400).send({ 
                msg: "Insufficient available balance",
                availableBalance: user.wallet.availableBalance
            });
        }

        // Minimum withdrawal amount
        if (amount < 1000) {
            return res.status(400).send({ msg: "Minimum withdrawal amount is ₦1,000" });
        }

        // Create payout request
        const payoutRequest = await PayoutRequest.create({
            userId,
            userName: user.displayName || user.username,
            amount,
            accountDetails: user.wallet.bankDetails,
            status: 'pending'
        });

        // Deduct from available balance and add to pending
        user.wallet.availableBalance -= amount;
        user.wallet.pendingBalance += amount;
        await user.save();

        // Create transaction record
        await Transaction.create({
            userId,
            type: 'withdrawal',
            amount: -amount,
            description: `Withdrawal request - ₦${amount.toLocaleString()}`,
            status: 'pending',
            reference: payoutRequest._id.toString()
        });

        // Notify user
        await createNotification(
            userId,
            'general',
            'Payout Requested',
            `Your withdrawal request of ₦${amount.toLocaleString()} is being processed. You'll receive payment within 48 hours.`,
            '/users/wallet'
        );

        res.send({ 
            msg: "Payout request submitted successfully",
            payoutRequest,
            estimatedTime: "Within 48 hours"
        });
    } catch (error) {
        console.error("Request payout error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

// Unlock event earnings (called 1 hour after event ends)
exports.unlockEventEarnings = async (eventId) => {
    try {
        const event = await Event.findOne({ event_id: eventId });
        if (!event) return;

        const organizer = await User.findOne({ user_token: event.organizer });
        if (!organizer) return;

        // Calculate total earnings from this event
        const eventEarnings = event.participants.reduce((sum, p) => {
            return sum + (p.amount_paid || 0);
        }, 0);

        // Move from locked to available
        organizer.wallet.lockedBalance -= eventEarnings;
        organizer.wallet.availableBalance += eventEarnings;
        await organizer.save();

        // Notify organizer
        await createNotification(
            organizer.user_token,
            'general',
            'Earnings Unlocked',
            `₦${eventEarnings.toLocaleString()} from "${event.name}" is now available for withdrawal.`,
            '/users/wallet'
        );

        console.log(`Unlocked ₦${eventEarnings} for event ${eventId}`);
    } catch (error) {
        console.error("Unlock event earnings error:", error);
    }
};

// Add funds to wallet (when ticket is sold)
exports.addTicketSale = async (organizerId, amount, eventId, eventName) => {
    try {
        const organizer = await User.findOne({ user_token: organizerId });
        if (!organizer) return;

        // Add to locked balance (will be unlocked 1 hour after event)
        organizer.wallet.lockedBalance += amount;
        organizer.wallet.totalEarnings += amount;
        await organizer.save();

        // Create transaction
        await Transaction.create({
            userId: organizerId,
            type: 'ticket_sale',
            amount: amount,
            description: `Ticket sale - ${eventName}`,
            eventId,
            eventName,
            status: 'completed'
        });

        // Notify organizer
        await createNotification(
            organizerId,
            'ticket_sale',
            'Ticket Sold!',
            `You earned ₦${amount.toLocaleString()} from a ticket sale for "${eventName}". Funds will be available 1 hour after the event.`,
            `/event/${eventId}/manage`
        );
    } catch (error) {
        console.error("Add ticket sale error:", error);
    }
};

// Deduct from wallet (when user buys ticket)
exports.deductTicketPurchase = async (userId, amount, eventId, eventName) => {
    try {
        // Create transaction
        await Transaction.create({
            userId,
            type: 'ticket_purchase',
            amount: -amount,
            description: `Ticket purchase - ${eventName}`,
            eventId,
            eventName,
            status: 'completed'
        });

        // Notify user
        await createNotification(
            userId,
            'ticket_purchase',
            'Ticket Purchased',
            `You purchased a ticket for "${eventName}" - ₦${amount.toLocaleString()}`,
            `/event/${eventId}`
        );
    } catch (error) {
        console.error("Deduct ticket purchase error:", error);
    }
};

// Process refund
exports.processRefund = async (userId, amount, eventId, eventName) => {
    try {
        const user = await User.findOne({ user_token: userId });
        if (!user) return;

        // Add refund to available balance
        user.wallet.availableBalance += amount;
        await user.save();

        // Create transaction
        await Transaction.create({
            userId,
            type: 'refund_received',
            amount: amount,
            description: `Refund - ${eventName}`,
            eventId,
            eventName,
            status: 'completed'
        });

        // Notify user
        await createNotification(
            userId,
            'refund_processed',
            'Refund Processed',
            `You received a refund of ₦${amount.toLocaleString()} for "${eventName}"`,
            '/users/wallet'
        );
    } catch (error) {
        console.error("Process refund error:", error);
    }
};

module.exports = exports;
