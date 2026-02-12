const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const port = Number(process.env.SMTP_PORT) || 587;

  // Log config (careful not to log password)
  console.log("Initializing Transporter:", {
    host: process.env.SMTP_HOST,
    port: port,
    secure: port === 465,
    user: process.env.SMTP_USER,
  });

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Helps with some self-signed certs or proxy issues
    },
    connectionTimeout: 20000, // Increased timeout to 20s
    greetingTimeout: 20000,
    socketTimeout: 20000,
    logger: true, // Enable logging
    debug: true, // Enable debug output
  });

  return transporter;
}

async function sendEmail(to, subject, html) {
  const t = getTransporter();
  // Ensure we use a verified sender. If SMTP_FROM_EMAIL is not set, fallback to SMTP_USER
  const from =
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_USER ||
    "noreply@unihub.app";

  await t.sendMail({
    from: from,
    to,
    subject,
    html,
  });
  return true;
}

exports.sendOTP = (email, otp) =>
  sendEmail(email, "Your OTP Code", `<h2>${otp}</h2>`);

exports.sendWelcomeEmail = (user) =>
  sendEmail(user.email, "Welcome", "<h1>Welcome to UniHub</h1>");

exports.sendLoginAlertEmail = (user) =>
  sendEmail(user.email, "Login Alert", "<p>New login detected</p>");

exports.getTransporter = getTransporter;
