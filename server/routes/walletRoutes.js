const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
    getWallet,
    updateBankDetails,
    requestPayout
} = require("../controllers/walletController");

router.post("/", authenticate, getWallet);
router.post("/bank-details", authenticate, updateBankDetails);
router.post("/payout", authenticate, requestPayout);

module.exports = router;
