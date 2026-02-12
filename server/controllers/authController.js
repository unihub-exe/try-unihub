const OtpAuth = require("../models/otpAuth");
const User = require("../models/user");
const bcrypt = require("bcrypt");
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

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).send({ msg: "Email not registered" });
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
    { expiresIn: "15m" }
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

  const token = jwt.sign({ email, role }, JWT_SECRET);

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
