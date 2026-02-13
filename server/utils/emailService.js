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

// Modern, conversion-optimized email templates
const emailStyles = {
    container: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
  `,
    header: `
    <div style="text-align: center; padding: 40px 20px 30px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
      <img src="https://try-unihub.vercel.app/img/only_logo.png" alt="UniHub" style="height: 48px; width: auto;">
    </div>
  `,
    content: `
    <div style="background-color: #ffffff; padding: 40px 30px;">
  `,
    footer: `
    </div>
    <div style="text-align: center; padding: 40px 30px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px; line-height: 1.6;">
        Built for the new era of campus life
      </p>
      <p style="margin: 0; font-size: 12px;">
        <a href="https://try-unihub.vercel.app" style="color: #5F57F7; text-decoration: none; font-weight: 500;">unihub.app</a>
        <span style="color: #cbd5e1; margin: 0 8px;">·</span>
        <a href="https://try-unihub.vercel.app/privacy" style="color: #94a3b8; text-decoration: none;">Privacy</a>
      </p>
    </div>
  `,
    button: `
    display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); 
    color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; 
    letter-spacing: -0.01em; transition: all 0.2s;
  `,
    highlightBox: `
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
    border: 1px solid #e2e8f0; padding: 24px; margin: 24px 0; border-radius: 12px;
  `,
    otpCode: `
    display: inline-block; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); 
    color: white; font-size: 36px; font-weight: 700; letter-spacing: 12px; padding: 24px 40px; 
    border-radius: 16px; margin: 24px 0; font-family: 'Courier New', monospace;
  `,
    statusBadge: `
    display: inline-block; padding: 6px 12px; background-color: #dcfce7; color: #166534; 
    border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; 
    letter-spacing: 0.5px;
  `,
};

// OTP Email
exports.sendOTP = (email, otp) =>
    sendEmail(
        email,
        "Your UniHub Verification Code",
        `
    ${emailStyles.container}
    ${emailStyles.header}
    ${emailStyles.content}
      <h2 style="color: #0f172a; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.02em; line-height: 1.2;">
        Verify your account
      </h2>
      <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
        Welcome to the Campus Operating System. Enter this code to complete your setup:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <div style="${emailStyles.otpCode}">${otp}</div>
      </div>
      <div style="${emailStyles.highlightBox}">
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
          <strong style="color: #1e293b;">Security Notice:</strong> This code expires in 10 minutes. 
          Never share verification codes with anyone—not even UniHub support.
        </p>
      </div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
        Didn't request this? Your account is secure. You can safely ignore this message.
      </p>
    ${emailStyles.footer}
    `
    );

// Welcome Email
exports.sendWelcomeEmail = (user) =>
    sendEmail(
        user.email,
        "Welcome to UniHub",
        `
    ${emailStyles.container}
    ${emailStyles.header}
    ${emailStyles.content}
      <h2 style="color: #0f172a; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.02em; line-height: 1.2;">
        Welcome, ${user.username || user.displayName || "there"}
      </h2>
      <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
        You're now part of the Campus Operating System. Here's what you can do:
      </p>
      
      <div style="margin: 32px 0;">
        <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background: linear-gradient(135deg, #5F57F7 0%, #7C3AED 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
            <span style="color: white; font-size: 20px; font-weight: 600;">1</span>
          </div>
          <div>
            <h3 style="margin: 0 0 6px 0; color: #1e293b; font-size: 16px; font-weight: 600;">Discover Events</h3>
            <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">Browse 500+ active campus events and secure your spot instantly</p>
          </div>
        </div>
        
        <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
            <span style="color: white; font-size: 20px; font-weight: 600;">2</span>
          </div>
          <div>
            <h3 style="margin: 0 0 6px 0; color: #1e293b; font-size: 16px; font-weight: 600;">Join Communities</h3>
            <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">Connect with verified students and build your campus network</p>
          </div>
        </div>
        
        <div style="display: flex; align-items: flex-start;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
            <span style="color: white; font-size: 20px; font-weight: 600;">3</span>
          </div>
          <div>
            <h3 style="margin: 0 0 6px 0; color: #1e293b; font-size: 16px; font-weight: 600;">Create & Manage</h3>
            <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">Launch your own events with our powerful ticketing engine</p>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin: 40px 0 0 0;">
        <a href="https://try-unihub.vercel.app/users/dashboard" style="${emailStyles.button}">Open Dashboard</a>
      </div>
      
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0; text-align: center;">
        Need help getting started? Check out our <a href="https://try-unihub.vercel.app/guide" style="color: #5F57F7; text-decoration: none;">quick start guide</a>
      </p>
    ${emailStyles.footer}
    `
    );

// Login Alert Email
exports.sendLoginAlertEmail = (user) =>
    sendEmail(
        user.email,
        "New Login Detected",
        `
    ${emailStyles.container}
    ${emailStyles.header}
    ${emailStyles.content}
      <div style="text-align: center; margin: 0 0 24px 0;">
        <div style="display: inline-block; padding: 8px 16px; background-color: #fef3c7; border-radius: 8px;">
          <span style="color: #92400e; font-size: 13px; font-weight: 600;">Security Alert</span>
        </div>
      </div>
      
      <h2 style="color: #0f172a; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.02em; line-height: 1.2;">
        New login detected
      </h2>
      <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
        Hi ${user.username || user.displayName || "there"}, we detected a new login to your UniHub account.
      </p>
      
      <div style="${emailStyles.highlightBox}">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">Time</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${new Date().toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Device</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${typeof navigator !== 'undefined' ? navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser' : 'Unknown Device'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Location</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">Nigeria</td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: #fef2f2; border-left: 3px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 8px;">
        <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
          <strong>Wasn't you?</strong> Secure your account immediately by changing your password and reviewing recent activity.
        </p>
      </div>
      
      <div style="text-align: center; margin: 32px 0 0 0;">
        <a href="https://try-unihub.vercel.app/users/settings" style="${emailStyles.button}">Review Account Security</a>
      </div>
      
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0; text-align: center;">
        This was you? No action needed. Your account is secure.
      </p>
    ${emailStyles.footer}
    `
    );

// Ticket Email (with user name)
exports.sendTicketEmail = (details, user) =>
    sendEmail(
        details.email,
        "Your Ticket: " + details.event_name,
        `
    ${emailStyles.container}
    ${emailStyles.header}
    ${emailStyles.content}
      <div style="text-align: center; margin: 0 0 24px 0;">
        <div style="${emailStyles.statusBadge}">Confirmed</div>
      </div>
      
      <h2 style="color: #0f172a; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.02em; line-height: 1.2;">
        You're going to ${details.event_name}
      </h2>
      <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
        Hi ${user.username || user.displayName || details.name}, your ticket is confirmed. Here are your event details:
      </p>
      
      <div style="${emailStyles.highlightBox}">
        <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">${details.event_name}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 100px;">Date</td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${details.date}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Time</td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${details.time}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Venue</td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${details.venue}</td>
          </tr>
          ${details.price > 0 ? `
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Price</td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 500;">₦${details.price}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Ticket Type</td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${details.ticketType || "General Admission"}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Entry Code</p>
        <div style="display: inline-block; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 20px 32px; border-radius: 16px;">
          <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 6px;">
            ${details.pass}
          </div>
        </div>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 32px 0; border-radius: 12px; text-align: center;">
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
          Present this code at the entrance. A copy has been sent to your WhatsApp for quick access.
        </p>
      </div>
      
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0; text-align: center;">
        Questions? Contact the event organizer through your dashboard.
      </p>
    ${emailStyles.footer}
    `
  );

exports.getTransporter = getTransporter;