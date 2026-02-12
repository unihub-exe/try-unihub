const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sendEmail } = require('./utils/emailService');

const testEmail = async () => {
    const user = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.NODE_MAILER_USER;
    if (!user) {
        console.error("Error: Email User (SMTP_USER or NODE_MAILER_USER) is not set in .env");
        process.exit(1);
    }

    const recipient = process.argv[2] || user;
    console.log(`Attempting to send test email to: ${recipient}`);

    const subject = "UniHub Email Test";
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Email Test Successful!</h1>
            <p>This is a test email from your UniHub application.</p>
            <p>If you are reading this, your email configuration is working correctly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
    `;

    const success = await sendEmail(recipient, subject, html);

    if (success) {
        console.log("✅ Test email sent successfully!");
    } else {
        console.error("❌ Failed to send test email. Check your logs and configuration.");
    }
};

testEmail();
