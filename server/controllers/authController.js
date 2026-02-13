const OtpAuth = require("../models/otpAuth");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const {
  sendOTP,
  sendWelcomeEmail,
  sendLoginAlertEmail,
} = require("../utils/emailService");

const JWT_SECRET = process.env.JWT_SECRET;

/* =======================
   SIGN IN (OTP)
======================= */
exports.signIn = async (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).send({ msg: "Email required" });

  // Check if email is blacklisted
  const Blacklist = require("../models/Blacklist");
  const blacklisted = await Blacklist.findOne({ email });
  if (blacklisted) {
    return res.status(403).send({ 
      msg: "This email has been blacklisted and cannot be used to access UniHub.",
      reason: blacklisted.reason
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).send({ msg: "Email not registered" });
  }

  // Check if account is suspended
  if (user.suspended) {
    if (user.suspendedUntil && new Date() < user.suspendedUntil) {
      return res.status(403).send({ 
        msg: "Your account is suspended",
        suspendedUntil: user.suspendedUntil,
        reason: user.suspensionReason
      });
    } else {
      // Suspension expired, lift it
      user.suspended = false;
      user.suspendedUntil = null;
      user.suspensionReason = null;
      user.accountStatus = 'active';
      await user.save();
    }
  }

  // Check if account is deleted
  if (user.accountStatus === 'deleted') {
    return res.status(403).send({ 
      msg: "This account has been deleted and cannot be accessed."
    });
  }

  await OtpAuth.deleteMany({ email });

  const otp = otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  const hash = await bcrypt.hash(otp, 10);

  await OtpAuth.create({ email, otp: hash });

  // NON-BLOCKING EMAIL
  sendOTP(email, otp).catch(console.error);

  res.send({ msg: "OTP sent" });
};

/* =======================
   VERIFY LOGIN OTP
======================= */
exports.verifyLogin = async (req, res) => {
  const { email, otp } = req.body;

  const record = await OtpAuth.findOne({ email });
  if (!record) return res.status(400).send({ msg: "OTP expired" });

  const valid = await bcrypt.compare(otp, record.otp);
  if (!valid) return res.status(400).send({ msg: "Invalid OTP" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).send({ msg: "User missing" });

  const token = jwt.sign(
    { user_token: user.user_token, role: user.role },
    JWT_SECRET,
    { expiresIn: "15m", issuer: "unihub" }
  );

  sendLoginAlertEmail(user).catch(console.error);

  res.send({
    msg: "Login successful",
    accessToken: token,
    user,
  });
};

/* =======================
   SIGN UP OTP
======================= */
exports.signUp = async (req, res) => {
  const { email } = req.body;

  // Check if email is blacklisted
  const Blacklist = require("../models/Blacklist");
  const blacklisted = await Blacklist.findOne({ email });
  if (blacklisted) {
    return res.status(403).send({ 
      msg: "This email has been blacklisted and cannot be used to create an account.",
      reason: blacklisted.reason
    });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).send({ msg: "Already registered" });
  }

  await OtpAuth.deleteMany({ email });

  const otp = otpGenerator.generate(6, { digits: true });
  const hash = await bcrypt.hash(otp, 10);

  await OtpAuth.create({ email, otp: hash });

  // NON-BLOCKING EMAIL
  sendOTP(email, otp).catch((err) => {
    console.error("Failed to send signup OTP email:", err);
  });

  res.send({ msg: "OTP sent" });
};

/* =======================
   VERIFY SIGNUP OTP
======================= */
exports.verifyOtp = async (req, res) => {
  const { email, otp, name, isOrganization } = req.body;

  const record = await OtpAuth.findOne({ email });
  if (!record) return res.status(400).send({ msg: "OTP expired" });

  const valid = await bcrypt.compare(otp, record.otp);
  if (!valid) return res.status(400).send({ msg: "Invalid OTP" });

  const role = isOrganization ? "ORGANIZER" : "ATTENDEE";

  const token = jwt.sign({ email, role }, JWT_SECRET, { issuer: "unihub" });

  // Generate a username from name or email
  let baseUsername = name ? name.replace(/\s+/g, "").toLowerCase() : email.split("@")[0];
  let username = baseUsername;
  let counter = 1;
  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter++}`;
  }

  const user = await User.create({
    user_token: token,
    email,
    username,
    displayName: name,
    role,
  });

  sendWelcomeEmail(user).catch(console.error);
  await OtpAuth.deleteMany({ email });

  res.send({ msg: "Signup complete", user });
};
