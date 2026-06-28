import { Resend } from 'resend';

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

export const isMailConfigured = () => Boolean(resend);

export const sendMail = async ({ to, subject, text, html }) => {
  const from = process.env.MAIL_FROM || 'HeartCave <onboarding@resend.dev>';

  if (!resend) {
    console.log(
      `\n[mailer] Email not configured — NOT sent.\n  To: ${to}\n  Subject: ${subject}\n  ${text || ''}\n`
    );
    return { skipped: true };
  }

  const { data, error } = await resend.emails.send({ from, to, subject, text, html });
  if (error) {
    throw new Error(error.message || JSON.stringify(error));
  }
  return data;
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

export const sendFeedbackNotification = async (feedback = {}) => {
  const to = process.env.MAIL_FROM || 'onboarding@resend.dev';
  const subject = 'New HeartCave feedback received';
  const body = feedback.message || feedback.text || JSON.stringify(feedback);
  return sendMail({
    to,
    subject,
    text: `New feedback was submitted on HeartCave.\n\n${body}`,
    html: `<p>New feedback was submitted on HeartCave.</p><p>${body}</p>`,
  });
};