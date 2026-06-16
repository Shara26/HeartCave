import mongoose from 'mongoose';

// Used for async match alerts ("someone with a similar journey joined"),
// connection request alerts, and high-priority admin/moderator alerts.
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'match_found',
        'connection_request',
        'request_accepted',
        'request_rejected',
        'moderation_alert',
        'admin_alert',
        'system',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    priority: { type: String, enum: ['normal', 'high'], default: 'normal' },
    refId: { type: mongoose.Schema.Types.ObjectId },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
