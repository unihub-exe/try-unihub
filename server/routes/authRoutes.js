const express = require("express");
const router = express.Router();
const {
    signUp,
    verifyOtp,
    signIn,
    verifyLogin,
} = require("../controllers/authController");

router.route("/signup").post(signUp);
router.route("/signup/verify").post(verifyOtp);
router.route("/signin").post(signIn);
router.route("/signin/verify").post(verifyLogin);
// router.route("/register").post(register);
// router.route("/verify-email").post(verifyEmail);
// router.route("/login").post(login);
// router.route("/refresh").post(refresh);

module.exports = router;
