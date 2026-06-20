import mongoose from 'mongoose';

// Exported so the controller, validator, and admin UI all share one source.
export const FEEDBACK_TYPES = [
  'Bug Report',
  'Feature Request',
  'General Feedback',
  'Improvement Suggestion',
];

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 80, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, default: '' },
    type: {
      type: String,
      enum: FEEDBACK_TYPES,
      default: 'General Feedback',
      index: true,
    },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    // Who submitted it (handy for spam triage); never shown publicly.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true } // adds createdAt + updatedAt
);

feedbackSchema.index({ createdAt: -1 }); // newest-first queries

export default mongoose.model('Feedback', feedbackSchema);