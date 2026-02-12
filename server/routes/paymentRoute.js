const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/paymentController");
const { authenticate } = require("../middleware/auth");

router.route("/payment").post(payment);
router.route("/payment/free").post(freeRegister);
router.route("/payment/cancel").post(cancelRegistration);

// Wallet funding routes
router.route("/wallet/fund").post(authenticate, fundWallet);
router.route("/wallet/initialize").post(authenticate, initializePaystackPayment);
router.route("/wallet/verify").post(authenticate, verifyWalletFunding);

// Transaction routes
router.route("/transactions").post(authenticate, getTransactions);

// Withdrawal routes
router.route("/withdrawal/request").post(authenticate, requestWithdrawal);
router.route("/withdrawal/history").post(authenticate, getWithdrawalHistory);

// Paystack webhook (no auth - uses signature verification)
router.route("/webhook/paystack").post(express.raw({ type: 'application/json' }), paystackWebhook);

module.exports = router;