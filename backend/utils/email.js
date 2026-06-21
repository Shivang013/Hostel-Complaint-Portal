const nodemailer = require('nodemailer');

// Sends an email notification when a complaint's status changes.
// If SMTP env vars are not set, it silently skips (so the app works without email config).
const sendStatusUpdateEmail = async ({ to, complaintTitle, newStatus }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[email skipped] Would notify ${to}: "${complaintTitle}" -> ${newStatus}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Hostel Complaint Portal" <${process.env.SMTP_USER}>`,
      to,
      subject: `Complaint Update: ${complaintTitle}`,
      text: `Your complaint "${complaintTitle}" status has been updated to: ${newStatus}.`,
    });
  } catch (err) {
    console.error('Failed to send status update email:', err.message);
  }
};

module.exports = { sendStatusUpdateEmail };
