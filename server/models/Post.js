import mongoose from 'mongoose';
import { REACTIONS, MODERATION_STATUS } from '../config/constants.js';

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    isExperienceShare: { type: Boolean, default: false },
    moderationStatus: {
      type: String,
      enum: Object.values(MODERATION_STATUS),
      default: MODERATION_STATUS.SAFE,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// One reaction per user; the type can change but only one is counted.
const reactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: REACTIONS, required: true },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    reactions: [reactionSchema],
    comments: [commentSchema],
    moderationStatus: {
      type: String,
      enum: Object.values(MODERATION_STATUS),
      default: MODERATION_STATUS.SAFE,
    },
    moderationReason: { type: String, default: '' },
    isRemoved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });

// Aggregate reaction counts for the feed without leaking who reacted.
postSchema.methods.reactionCounts = function reactionCounts() {
  return this.reactions.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});
};

export default mongoose.model('Post', postSchema);
