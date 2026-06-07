const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

const baseFrom = () =>
  `"${process.env.SMTP_FROM_NAME || 'Governess College'}" <${process.env.SMTP_USER}>`;

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[email] SMTP not configured — skipping send to', to);
    return;
  }
  const transporter = createTransporter();
  return transporter.sendMail({ from: baseFrom(), to, subject, html, text });
};

const header = (title) => `
  <div style="background:#0B4DA2;padding:24px;text-align:center;">
    <h1 style="color:white;margin:0;font-family:Arial,sans-serif;">${title}</h1>
  </div>`;

const footer = () => `
  <div style="background:#1A2332;padding:16px;text-align:center;">
    <p style="color:#9ca3af;margin:0;font-size:12px;font-family:Arial,sans-serif;">
      Governess College of English &nbsp;|&nbsp; ${process.env.ADMIN_EMAIL || 'governessenglish@gmail.com'}
    </p>
  </div>`;

const wrap = (title, bodyHtml) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    ${header(title)}
    <div style="padding:32px;background:#ffffff;">${bodyHtml}</div>
    ${footer()}
  </div>`;

// ── Contact form notifications ────────────────────────────────────────────────

const sendContactNotification = (contact) =>
  sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
    subject: `New Inquiry: ${contact.subject}`,
    html: wrap(
      'New Contact Inquiry',
      `<p><strong>Name:</strong> ${contact.name}</p>
       <p><strong>Email:</strong> ${contact.email}</p>
       <p><strong>Phone:</strong> ${contact.phone || 'Not provided'}</p>
       <p><strong>Subject:</strong> ${contact.subject}</p>
       <p><strong>Message:</strong></p>
       <p style="background:#f4f8ff;padding:16px;border-radius:6px;">${contact.message}</p>
       <p style="color:#6B7280;font-size:12px;">Submitted: ${new Date().toLocaleString()}</p>`
    ),
  });

const sendContactAutoReply = (contact) =>
  sendEmail({
    to: contact.email,
    subject: 'We Received Your Inquiry — Governess College',
    html: wrap(
      'Thank You for Contacting Us!',
      `<p>Dear ${contact.name},</p>
       <p>Thank you for contacting Governess College of English. We have received your message and our team will get back to you shortly.</p>
       <blockquote style="border-left:3px solid #E8B21D;padding-left:16px;color:#555;margin:16px 0;">
         ${contact.message}
       </blockquote>
       <p>We typically respond within 24–48 hours.</p>
       <p>Best regards,<br/><strong>Governess College of English Team</strong></p>`
    ),
  });

const sendContactReply = (contact, replyMessage) =>
  sendEmail({
    to: contact.email,
    subject: `Re: ${contact.subject || 'Your Inquiry'} — Governess College`,
    html: wrap(
      'Reply from Governess College',
      `<p>Dear ${contact.name},</p>
       <div style="margin:16px 0;">${replyMessage.replace(/\n/g, '<br/>')}</div>
       <p>Best regards,<br/><strong>Governess College of English Team</strong></p>
       <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
       <p style="color:#9ca3af;font-size:12px;margin:0 0 4px 0;"><strong>Original message:</strong></p>
       <blockquote style="border-left:3px solid #E8B21D;padding-left:12px;color:#6B7280;margin:0;font-size:13px;">
         ${contact.message}
       </blockquote>`
    ),
  });

// ── Order emails ──────────────────────────────────────────────────────────────

const sendOrderConfirmation = (order, user) => {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${i.title}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${i.price.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return sendEmail({
    to: order.billingInfo?.email || user.email,
    subject: `Order Confirmation — ${order.orderNumber}`,
    html: wrap(
      'Order Confirmed!',
      `<p>Dear ${order.billingInfo?.fullName || user.name},</p>
       <p>Your order <strong>${order.orderNumber}</strong> has been received.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0;">
         <tr style="background:#f4f8ff;">
           <th style="padding:8px;text-align:left;">Course</th>
           <th style="padding:8px;text-align:right;">Price</th>
         </tr>
         ${rows}
         <tr style="font-weight:bold;">
           <td style="padding:8px;">Total</td>
           <td style="padding:8px;text-align:right;">$${order.total.toFixed(2)}</td>
         </tr>
       </table>
       <p>You can view your courses in your <strong>My Courses</strong> dashboard.</p>
       <p>Best regards,<br/><strong>Governess College of English Team</strong></p>`
    ),
  });
};

// ── Auth emails ───────────────────────────────────────────────────────────────

const sendWelcomeEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: 'Welcome to Governess College of English!',
    html: wrap(
      'Welcome!',
      `<p>Dear ${user.name},</p>
       <p>Welcome to Governess College of English! Your account has been created successfully.</p>
       <p>You can now browse our courses, enroll and access your personalized dashboard.</p>
       <p>Best regards,<br/><strong>Governess College of English Team</strong></p>`
    ),
  });

const sendPasswordReset = (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  return sendEmail({
    to: user.email,
    subject: 'Password Reset — Governess College',
    html: wrap(
      'Password Reset',
      `<p>Dear ${user.name},</p>
       <p>You requested a password reset. Click the button below (valid for 1 hour):</p>
       <div style="text-align:center;margin:32px 0;">
         <a href="${resetUrl}" style="background:#E8B21D;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
           Reset Password
         </a>
       </div>
       <p>If you didn't request this, please ignore this email.</p>
       <p>Best regards,<br/><strong>Governess College of English Team</strong></p>`
    ),
  });
};

module.exports = {
  sendEmail,
  sendContactNotification,
  sendContactAutoReply,
  sendContactReply,
  sendOrderConfirmation,
  sendWelcomeEmail,
  sendPasswordReset,
};
