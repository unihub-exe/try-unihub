const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
    if (transporter) return transporter;

    const port = Number(process.env.SMTP_PORT) || 587;

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 20000,
    });

    return transporter;
}

async function sendEmail(to, subject, html) {
    const t = getTransporter();
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

// Email templates with fun, professional styling
const emailStyles = {
    container: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
  `,
    header: `
    <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #5F57F7 0%, #7C3AED 100%); border-radius: 16px 16px 0 0;">
      <img src="https://unihub.app/img/unihub-logo.png" alt="UniHub" style="height: 40px; margin-bottom: 10px;">
      <h1 style="color: white; margin: 0; font-size: 24px;">UniHub</h1>
    </div>
  `,
    content: `
    <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  `,
    footer: `
    </div>
    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
      <p>Made with ❤️ by the UniHub Team</p>
      <p style="margin-top: 8px;">
        <a href="https://unihub.app" style="color: #5F57F7; text-decoration: none;">Visit Website</a> · 
        <a href="#" style="color: #5F57F7; text-decoration: none;">Privacy Policy</a>
      </p>
    </div>
  `,
    button: `
    display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #5F57F7 0%, #7C3AED 100%); 
    color: white; text-decoration: none; border-radius: 10px; font-weight: 600; margin-top: 20px;
  `,
    highlightBox: `
    background-color: #f1f5f9; border-left: 4px solid #5F57F7; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;
  `,
    otpCode: `
    display: inline-block; background: linear-gradient(135deg, #5F57F7 0%, #7C3AED 100%); 
    color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 30px; 
    border-radius: 12px; margin: 20px 0;
  `,
};

// OTP Email
exports.sendOTP = (email, otp) =>
    sendEmail(
        email,
        "🔐 Your UniHub Verification Code",
        `
    ${emailStyles.container}
    ${emailStyles.header}
    ${emailStyles.content}
      <h2 style="color: #1e293b; margin-bottom: 20px;">Welcome to UniHub! 🎓</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
        Hi there! Here's your verification code to get you started:
      </p>
      <div style="text-align: center;">
        ${emailStyles.otpCode}${otp}</div>
      <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
        This code will expire in <strong>10 minutes</strong>. Please don't share it with anyone! 🚫
      </p>
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        If you didn't request this code, you can safely ignore this email. 🙈
      </p>
    ${emailStyles.footer}
    `
    );

// Welcome Email
exports.sendWelcomeEmail = (user) =>
    sendEmail(
        user.email,
        "🎉 Welcome to UniHub - Let's Get Started!",
        `
    ${emailStyles.container}
    ${emailStyles.header}
    ${emailStyles.content}
      <h2 style="color: #1e293b; margin-bottom: 20px;">Welcome aboard, ${user.username || user.displayName || "Future Leader"}! 🎓</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
        Congratulations on joining UniHub! You're now part of an amazing community of students just like you. 
        Here's what you can do:
      </p>
      <div style="${emailStyles.highlightBox}">
        <p style="margin: 0 0 10px 0; color: #1e293b;"><strong>✨ Discover Events:</strong> Find amazing events happening on campus</p>
        <p style="margin: 0 0 10px 0; color: #1e293b;"><strong>🎫 Get Tickets:</strong> Secure your spot at the best events</p>
        <p style="margin: 0 0 10px 0; color: #1e293b;"><strong>💬 Join Communities:</strong> Connect with like-minded peers</p>
        <p style="margin: 0; color: #1e293b;"><strong>🚀 Create Events:</strong> Share your own events with the community</p>
      </div>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
        Ready to explore? Click the button below to jump into your dashboard!
      </p>
      <div style="text-align: center;">
        <a href="https://unihub.app/users/dashboard" style="${emailStyles.button}">Explore Events →</a>
      </div>
    ${emailStyles.footer}
    `
    );

// Login Alert Email
exports.sendLoginAlertEmail = (user) =>
    sendEmail(
        user.email,
        "🔔 New Login Detected - UniHub",
        `
    ${emailStyles.container}
    ${emailStyles.header}
    ${emailStyles.content}
      <h2 style="color: #1e293b; margin-bottom: 20px;">New Device Login 📱</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
        Hi ${user.username || user.displayName || "there"}! We noticed a new login to your UniHub account.
      </p>
      <div style="${emailStyles.highlightBox}">
        <p style="margin: 0; color: #1e293b;"><strong>🌐 Location:</strong> Nigeria</p>
        <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>🖥️ Device:</strong> ${typeof navigator !== 'undefined' ? navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser' : 'Unknown Device'}</p>
        <p style="margin: 10px 0 0 0; color: #1e293b;"><strong>⏰ Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
        If this was you, you're all set! If not, please <a href="https://unihub.app/users/settings" style="color: #5F57F7;">secure your account</a> immediately. 🔒
      </p>
    ${emailStyles.footer}
    `
    );

// Ticket Email (with user name)
exports.sendTicketEmail = (details, user) =>
    sendEmail(
        details.email,
        "🎫 Your UniHub Event Ticket - " + details.event_name,
        `
    ${emailStyles.container}
    ${emailStyles.header}
    ${emailStyles.content}
      <h2 style="color: #1e293b; margin-bottom: 10px;">🎉 Your Ticket is Ready!</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
        Hi <strong>${user.username || user.displayName || details.name}</strong>! You're all set for this event. 🙌
      </p>
      
      <div style="${emailStyles.highlightBox}">
        <h3 style="margin: 0 0 15px 0; color: #5F57F7; font-size: 20px;">${details.event_name}</h3>
        <p style="margin: 8px 0; color: #475569;">
          <strong>📅 Date:</strong> ${details.date}
        </p>
        <p style="margin: 8px 0; color: #475569;">
          <strong>⏰ Time:</strong> ${details.time}
        </p>
        <p style="margin: 8px 0; color: #475569;">
          <strong>📍 Venue:</strong> ${details.venue}
        </p>
        ${details.price > 0 ? `<p style="margin: 8px 0; color: #475569;"><strong>💰 Price:</strong> ₦${details.price}</p>` : ''}
        <p style="margin: 8px 0; color: #475569;">
          <strong>🎟️ Ticket Type:</strong> ${details.ticketType || "General Admission"}
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #475569; font-size: 14px; margin-bottom: 15px;">Your unique ticket code:</p>
        <div style="display: inline-block; background: #f1f5f9; padding: 15px 25px; border-radius: 10px; font-family: monospace; font-size: 24px; font-weight: bold; color: #5F57F7; letter-spacing: 2px;">
          ${details.pass}
        </div>
      </div>

      <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
        Please present this ticket code at the event entrance. We've also sent a copy to your WhatsApp! 📱
      </p>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        See you at the event! 🎊
      </p>
    ${emailStyles.footer}
    `
  );

exports.getTransporter = getTransporter;