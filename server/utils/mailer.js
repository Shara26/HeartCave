import nodemailer from 'nodemailer';

let transporter;
let resolved = false;

// Build a transporter from env once. Returns null if SMTP isn't configured,
// so the app still works in development (emails get logged instead of sent).
const getTransporter = () => {
  if (resolved) return transporter;
  resolved = true;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/others
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  } else {
    transporter = null;
  }
  return transporter;
};

export const isMailConfigured = () => Boolean(getTransporter());

export const sendMail = async ({ to, subject, text, html }) => {
  const t = getTransporter();
  const from = process.env.MAIL_FROM || 'HeartCave <no-reply@heartcave.app>';
  if (!t) {
    // No SMTP configured — log so developers can still grab links locally.
    console.log(
      `\n[mailer] SMTP not configured — email NOT sent.\n  To: ${to}\n  Subject: ${subject}\n  ${text || ''}\n`
    );
    return { skipped: true };
  }
  return t.sendMail({ from, to, subject, text, html });
};

export const sendPasswordResetEmail = async (to, resetUrl) => {
  const subject = 'Reset your HeartCave password';
  const text =
    `You requested a password reset for your HeartCave account.\n\n` +
    `Reset it here (valid for 1 hour):\n${resetUrl}\n\n` +
    `If you didn't request this, you can safely ignore this email — your password won't change.`;
  const html =
    `<p>You requested a password reset for your HeartCave account.</p>` +
    `<p><a href="${resetUrl}">Reset your password</a> — this link is valid for 1 hour.</p>` +
    `<p>If you didn't request this, you can safely ignore this email.</p>`;
  return sendMail({ to, subject, text, html });
};

export const sendFeedbackNotification = async (feedback) => {
  const to = process.env.FEEDBACK_NOTIFY_EMAIL || process.env.MAIL_FROM || process.env.SMTP_USER;
  const subject = `New HeartCave feedback: ${feedback?.type || 'General'}`;
  const text =
    `New feedback submitted on HeartCave.\n\n` +
    `Type: ${feedback?.type || '-'}\n` +
    `Name: ${feedback?.name || 'Anonymous'}\n` +
    `Email: ${feedback?.email || '-'}\n\n` +
    `Message:\n${feedback?.message || ''}`;
  return sendMail({ to, subject, text });
};