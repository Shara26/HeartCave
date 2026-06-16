import mongoose from 'mongoose';
import { MODERATION_STATUS } from '../config/constants.js';

// Append-only audit trail of every automated moderation decision plus the
// admin actions taken in response. Powers the moderation dashboard.
const moderationLogSchema = new mongoose.Schema(
  {
    sourceType: { type: String, enum: ['message', 'post', 'comment'], required: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: { type: String, enum: Object.values(MODERATION_STATUS), required: true, index: true },
    categories: [String], // matched categories e.g. ["harassment","threats"]
    reason: { type: String, default: '' },
    score: { type: Number, default: 0 }, // 0..1 severity
    provider: { type: String, default: 'rules' },

    contentSnapshot: { type: String, default: '' },

    // Admin review.
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    resolution: { type: String, enum: ['pending', 'upheld', 'cleared'], default: 'pending' },
  },
  { timestamps: true }
);

moderationLogSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ModerationLog', moderationLogSchema);
