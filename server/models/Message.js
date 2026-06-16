import mongoose from 'mongoose';
import { MODERATION_STATUS } from '../config/constants.js';

const messageSchema = new mongoose.Schema(
  {
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 4000 },

    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },

    // Moderation is run BEFORE storage. BLOCKED messages are never persisted to
    // a deliverable state; they are recorded for evidence with status BLOCKED.
    moderationStatus: {
      type: String,
      enum: Object.values(MODERATION_STATUS),
      default: MODERATION_STATUS.SAFE,
      index: true,
    },
    moderationReason: { type: String, default: '' },
    moderationTimestamp: { type: Date, default: Date.now },

    // Blocked messages are stored but never delivered.
    delivered: { type: Boolean, default: true },
  },
  { timestamps: true }
);

messageSchema.index({ matchId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
