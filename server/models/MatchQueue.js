import mongoose from 'mongoose';

// Fallback for low user counts: if no good match exists at request time, the
// user is parked here. When new users register, pending entries are
// recalculated so connections can happen asynchronously (no need for both
// users to be online).
const matchQueueSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    struggles: [String],
    interests: [String],
    ageGroup: String,
    active: { type: Boolean, default: true },
    lastCheckedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('MatchQueue', matchQueueSchema);
