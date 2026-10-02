const nodemailer = require('nodemailer');

// Configure transporter based on environment variables
const createTransporter = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  // Return null if SMTP not configured (will log to console)
  return null;
};

/**
 * Send email helper
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const from = process.env.EMAIL_FROM || '"LIFORA Blood & Organ Network" <noreply@lifora.org>';

    if (transporter) {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: text || html.replace(/<[^>]*>?/gm, ''),
        html
      });
      console.log(`[LIFORA Email] Sent email to ${to}: MessageID ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`
=====================================================
  [LIFORA SIMULATED EMAIL TRANSMISSION]
  To: ${to}
  Subject: ${subject}
  ---------------------------------------------------
  ${text || html}
=====================================================
      `);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error('[LIFORA Email Error]:', error.message);
    // Don't crash request if email sending fails
    return { success: false, error: error.message };
  }
};

/**
 * Send email verification link
 */
const sendVerificationEmail = async (email, token, name) => {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #dc2626;">Welcome to LIFORA, ${name}!</h2>
      <p>Thank you for joining the LIFORA Blood & Organ Donation Network.</p>
      <p>Please click the button below to verify your email address and activate your account:</p>
      <a href="${verifyUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Verify Email Address</a>
      <p style="font-size: 12px; color: #64748b;">Or copy this link to your browser: ${verifyUrl}</p>
    </div>
  `;
  return await sendEmail({ to: email, subject: 'LIFORA – Verify Your Email Address', html });
};

/**
 * Send password reset link
 */
const sendPasswordResetEmail = async (email, token, name) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #dc2626;">LIFORA Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password for your LIFORA account.</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Reset Password</a>
      <p>This link is valid for 1 hour. If you did not request a password reset, please ignore this email.</p>
    </div>
  `;
  return await sendEmail({ to: email, subject: 'LIFORA – Password Reset Request', html });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};
