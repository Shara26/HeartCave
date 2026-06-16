import mongoose from 'mongoose';
import { REPORT_REASONS } from '../config/constants.js';

const reportSchema = new mongoose.Schema(
  {
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    description: { type: String, maxlength: 2000, default: '' },

    // Optional evidence linkage.
    context: {
      type: { type: String, enum: ['message', 'post', 'profile', 'chat'], default: 'profile' },
      refId: { type: mongoose.Schema.Types.ObjectId },
      snapshot: { type: String, default: '' }, // captured text at report time
    },

    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    priority: { type: String, enum: ['normal', 'high'], default: 'normal' },
    adminNotes: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Report', reportSchema);
