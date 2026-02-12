const express = require("express");
const router = express.Router();

const { payment, freeRegister, cancelRegistration, fundWallet, createWalletFundSession, confirmWalletFund } = require("../controllers/paymentController");
const { authenticate } = require("../middleware/auth");

router.route("/payment").post(payment);
router.route("/payment/free").post(freeRegister);
router.route("/payment/cancel").post(cancelRegistration);
router.route("/wallet/fund").post(authenticate, fundWallet);
router.route("/wallet/fund/session").post(authenticate, createWalletFundSession);
router.route("/wallet/fund/confirm").post(authenticate, confirmWalletFund);
module.exports = router;
