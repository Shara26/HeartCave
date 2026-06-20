import nodemailer from 'nodemailer';

let transporter = null;

// Build the transporter from env on first use. Returns null if SMTP isn't
// configured, so feedback still works locally without email set up.
const getTransporter = () => {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/others
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
};

export const sendFeedbackNotification = async (feedback) => {
  const t = getTransporter();
  const to = process.env.FEEDBACK_NOTIFY_EMAIL || process.env.SMTP_USER;
  if (!t || !to) {
    console.warn('[mailer] SMTP not configured — skipping feedback email');
    return false;
  }
  const clean = (s) => String(s || '').replace(/[<>]/g, ''); // strip HTML angle brackets
  await t.sendMail({
    from: process.env.SMTP_FROM || `HeartCave <${process.env.SMTP_USER}>`,
    to,
    subject: `New ${clean(feedback.type)} — HeartCave Feedback`,
    text:
      `Type:  ${feedback.type}\n` +
      `Name:  ${feedback.name || '(anonymous)'}\n` +
      `Email: ${feedback.email || '(not provided)'}\n` +
      `Time:  ${new Date(feedback.createdAt).toLocaleString()}\n\n` +
      `${feedback.message}`,
  });
  return true;
};