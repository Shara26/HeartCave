import Feedback, { FEEDBACK_TYPES } from '../models/Feedback.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { sendFeedbackNotification } from '../utils/mailer.js';

// POST /api/feedback  — any authenticated user
export const submitFeedback = asyncHandler(async (req, res) => {
  const { name = '', email = '', type = 'General Feedback', message } = req.body;
  if (!message || !message.trim()) throw new ApiError(400, 'Message is required');

  const feedback = await Feedback.create({
    name: name.trim().slice(0, 80),
    email: email.trim().toLowerCase().slice(0, 120),
    type: FEEDBACK_TYPES.includes(type) ? type : 'General Feedback',
    message: message.trim().slice(0, 2000),
    userId: req.user?._id || null,
  });

  // Email is best-effort — never fail the user's request if SMTP hiccups.
  sendFeedbackNotification(feedback).catch((e) =>
    console.error('[feedback] email failed:', e.message)
  );

  res.status(201).json({ success: true, message: 'Thank you! Your feedback was submitted.' });
});

// GET /api/feedback/admin?type=  — admin only, newest first, optional type filter
export const listFeedback = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type && FEEDBACK_TYPES.includes(req.query.type)) filter.type = req.query.type;

  const feedback = await Feedback.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json({
    success: true,
    types: FEEDBACK_TYPES,
    count: feedback.length,
    feedback: feedback.map((f) => ({
      id: f._id,
      name: f.name,
      email: f.email,
      type: f.type,
      message: f.message,
      createdAt: f.createdAt,
    })),
  });
});

// DELETE /api/feedback/admin/:id  — admin only
export const deleteFeedback = asyncHandler(async (req, res) => {
  const removed = await Feedback.findByIdAndDelete(req.params.id);
  if (!removed) throw new ApiError(404, 'Feedback not found');
  res.json({ success: true, message: 'Feedback deleted' });
});