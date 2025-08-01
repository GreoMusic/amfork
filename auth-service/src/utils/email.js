const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  'email-verification': {
    subject: 'Verify your Acadex Mini account',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Acadex Mini!</h2>
        <p>Hi ${data.name},</p>
        <p>Thank you for registering with Acadex Mini. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/verify-email?token=${data.verificationToken}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">
          ${process.env.FRONTEND_URL}/verify-email?token=${data.verificationToken}
        </p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account with Acadex Mini, you can safely ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Acadex Mini - Your Ultimate Grading Solution Powered by AI
        </p>
      </div>
    `
  },
  'password-reset': {
    subject: 'Reset your Acadex Mini password',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${data.name},</p>
        <p>We received a request to reset your password for your Acadex Mini account. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${data.resetToken}" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">
          ${process.env.FRONTEND_URL}/reset-password?token=${data.resetToken}
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Acadex Mini - Your Ultimate Grading Solution Powered by AI
        </p>
      </div>
    `
  },
  'welcome': {
    subject: 'Welcome to Acadex Mini!',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Acadex Mini!</h2>
        <p>Hi ${data.name},</p>
        <p>Welcome to Acadex Mini! Your account has been successfully created and verified.</p>
        <p>You can now:</p>
        <ul>
          <li>Create and manage your classes</li>
          <li>Upload and grade student papers</li>
          <li>Access AI-powered grading assistance</li>
          <li>Track student progress and analytics</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Get Started
          </a>
        </div>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Acadex Mini - Your Ultimate Grading Solution Powered by AI
        </p>
      </div>
    `
  }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Email template name
 * @param {Object} options.data - Template data
 * @param {string} options.html - Custom HTML content (optional)
 * @param {string} options.text - Plain text content (optional)
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    let html, subject;
    
    if (options.template && emailTemplates[options.template]) {
      const template = emailTemplates[options.template];
      subject = template.subject;
      html = template.html(options.data);
    } else {
      subject = options.subject;
      html = options.html;
    }

    const mailOptions = {
      from: `"Acadex Mini" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: subject,
      html: html,
      text: options.text || html.replace(/<[^>]*>/g, '') // Strip HTML for plain text
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: subject
    });

    return info;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * Send bulk emails
 * @param {Array} recipients - Array of recipient objects
 * @param {string} template - Email template name
 * @param {Object} data - Template data
 */
const sendBulkEmail = async (recipients, template, data) => {
  try {
    const transporter = createTransporter();
    const templateConfig = emailTemplates[template];
    
    if (!templateConfig) {
      throw new Error(`Email template '${template}' not found`);
    }

    const emails = recipients.map(recipient => ({
      from: `"Acadex Mini" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: recipient.email,
      subject: templateConfig.subject,
      html: templateConfig.html({ ...data, ...recipient })
    }));

    const results = await Promise.allSettled(
      emails.map(email => transporter.sendMail(email))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    logger.info('Bulk email sent:', {
      total: recipients.length,
      successful,
      failed
    });

    return { successful, failed, results };
  } catch (error) {
    logger.error('Failed to send bulk email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  emailTemplates
}; 