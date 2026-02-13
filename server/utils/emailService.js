const nodemailer = require("nodemailer");
const { generateTicketPDF, generateQRData } = require("./ticketService");

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



// Send ticket email with PDF attachment
async function sendTicketEmail(ticketData) {
  try {
    const {
      email,
      name,
      eventName,
      eventDate,
      eventTime,
      eventVenue,
      ticketType,
      price,
      ticketId,
      eventId,
      userId
    } = ticketData;

    // Generate QR data
    const qrData = generateQRData({ ticketId, eventId, userId });

    // Generate PDF ticket
    const pdfBuffer = await generateTicketPDF({
      ticketId,
      eventName,
      eventDate,
      eventTime,
      eventVenue,
      attendeeName: name,
      attendeeEmail: email,
      ticketType,
      price,
      qrData
    });

    const t = getTransporter();
    const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@unihub.app";

    const mailOptions = {
      from: `"UniHub Events" <${from}>`,
      to: email,
      subject: `Your Ticket for ${eventName} 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .ticket-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-label { font-weight: bold; color: #6b7280; }
            .info-value { color: #1f2937; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .highlight { color: #4F46E5; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎟️ Your Ticket is Ready!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Get ready for an amazing experience</p>
            </div>
            
            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              
              <p>Great news! Your ticket for <span class="highlight">${eventName}</span> has been confirmed. We're excited to see you there!</p>
              
              <div class="ticket-info">
                <h3 style="margin-top: 0; color: #1f2937;">📅 Event Details</h3>
                <div class="info-row">
                  <span class="info-label">Event:</span>
                  <span class="info-value">${eventName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date:</span>
                  <span class="info-value">${eventDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Time:</span>
                  <span class="info-value">${eventTime}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Venue:</span>
                  <span class="info-value">${eventVenue}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Ticket Type:</span>
                  <span class="info-value">${ticketType || 'General Admission'}</span>
                </div>
                ${price > 0 ? `
                <div class="info-row">
                  <span class="info-label">Amount Paid:</span>
                  <span class="info-value" style="color: #10b981; font-weight: bold;">₦${price.toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Ticket ID:</span>
                  <span class="info-value" style="font-family: monospace;">${ticketId.substring(0, 12).toUpperCase()}</span>
                </div>
              </div>

              <h3 style="color: #1f2937;">📱 What to Bring</h3>
              <ul style="color: #4b5563;">
                <li>Your ticket (attached PDF or show on your phone)</li>
                <li>Valid ID for verification</li>
                <li>Arrive 15 minutes early for smooth check-in</li>
              </ul>

              <p style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <strong>⚠️ Important:</strong> Your ticket PDF is attached to this email. You can also access it anytime from your UniHub dashboard.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://unihub.com'}/users/dashboard" class="button">
                  View in Dashboard
                </a>
              </div>

              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>See you at the event! 🎉</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The UniHub Team</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>© ${new Date().getFullYear()} UniHub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `ticket-${ticketId.substring(0, 8)}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await t.sendMail(mailOptions);
    console.log(`Ticket email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending ticket email:", error);
    throw error;
  }
}

// Send event reminder email (24 hours before)
async function sendEventReminderEmail(reminderData) {
  const { email, name, eventName, eventDate, eventTime, eventVenue, eventId } = reminderData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">⏰ Event Reminder</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p>Hi <strong>${name}</strong>,</p>
          
          <p>This is a friendly reminder that <strong>${eventName}</strong> is happening tomorrow!</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
            <h3 style="margin-top: 0;">📅 Event Details</h3>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Time:</strong> ${eventTime}</p>
            <p><strong>Venue:</strong> ${eventVenue}</p>
          </div>

          <p style="background: #dbeafe; padding: 15px; border-radius: 8px;">
            <strong>💡 Tip:</strong> Arrive 15 minutes early to avoid queues!
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://unihub.com'}/event/${eventId}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View Event Details
            </a>
          </div>

          <p>See you tomorrow! 🎉</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `Reminder: ${eventName} is Tomorrow!`, html);
}

// Send event cancellation email
async function sendEventCancellationEmail(cancellationData) {
  const { email, name, eventName, reason, refundAmount } = cancellationData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">❌ Event Cancelled</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p>Hi <strong>${name}</strong>,</p>
          
          <p>We regret to inform you that <strong>${eventName}</strong> has been cancelled.</p>
          
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          
          ${refundAmount > 0 ? `
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #065f46;">💰 Refund Processed</h3>
            <p style="color: #065f46;">A full refund of <strong>₦${refundAmount.toLocaleString()}</strong> has been processed to your wallet.</p>
          </div>
          ` : ''}

          <p>We apologize for any inconvenience this may have caused. We hope to see you at future events!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://unihub.com'}/users/dashboard" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Browse Other Events
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `Event Cancelled: ${eventName}`, html);
}

// Send account suspension email
async function sendAccountSuspensionEmail(suspensionData) {
  const { email, name, reason, suspendedUntil } = suspensionData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">⚠️ Account Suspended</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p>Hi <strong>${name}</strong>,</p>
          
          <p>Your UniHub account has been temporarily suspended.</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #92400e;">Suspension Details</h3>
            <p style="color: #92400e;"><strong>Reason:</strong> ${reason}</p>
            <p style="color: #92400e;"><strong>Suspended Until:</strong> ${new Date(suspendedUntil).toLocaleString()}</p>
          </div>

          <p>During this period, you will not be able to access your account. If you believe this is a mistake, please contact our support team.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:support@unihub.com" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, 'Your UniHub Account Has Been Suspended', html);
}

// Send payout approval/rejection email
async function sendPayoutStatusEmail(payoutData) {
  const { email, name, amount, status, reason } = payoutData;
  const isApproved = status === 'approved';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${isApproved ? '#10B981' : '#EF4444'} 0%, ${isApproved ? '#059669' : '#DC2626'} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">${isApproved ? '✅' : '❌'} Payout ${isApproved ? 'Approved' : 'Rejected'}</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p>Hi <strong>${name}</strong>,</p>
          
          <p>Your payout request of <strong>₦${amount.toLocaleString()}</strong> has been <strong>${status}</strong>.</p>
          
          ${isApproved ? `
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="color: #065f46;">The funds will be transferred to your bank account within 24-48 hours.</p>
          </div>
          ` : `
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="color: #991b1b;"><strong>Reason:</strong> ${reason || 'Please contact support for more information.'}</p>
          </div>
          `}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://unihub.com'}/users/wallet" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View Wallet
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `Payout ${isApproved ? 'Approved' : 'Rejected'}`, html);
}

// Send report action notification
async function sendReportActionEmail(reportData) {
  const { email, name, reportedContent, action, adminNotes } = reportData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">📋 Report Update</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p>Hi <strong>${name}</strong>,</p>
          
          <p>Thank you for reporting <strong>${reportedContent}</strong>. Our moderation team has reviewed your report.</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
            <h3 style="margin-top: 0;">Action Taken</h3>
            <p><strong>${action === 'dismissed' ? 'No Action Required' : action === 'suspended' ? 'Content Suspended' : 'Content Removed'}</strong></p>
            ${adminNotes ? `<p style="color: #6b7280;">${adminNotes}</p>` : ''}
          </div>

          <p>We appreciate your help in keeping UniHub safe and welcoming for everyone.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, 'Your Report Has Been Reviewed', html);
}

module.exports = {
  sendEmail,
  sendOTP: exports.sendOTP,
  sendWelcomeEmail: exports.sendWelcomeEmail,
  sendLoginAlertEmail: exports.sendLoginAlertEmail,
  sendTicketEmail,
  sendEventReminderEmail,
  sendEventCancellationEmail,
  sendAccountSuspensionEmail,
  sendPayoutStatusEmail,
  sendReportActionEmail
};
