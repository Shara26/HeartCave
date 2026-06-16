import mongoose from 'mongoose';

// A Match is an accepted, active connection between two users. It is the
// "room" private chat happens in. Created only when a ConnectionRequest is
// accepted.
const matchSchema = new mongoose.Schema(
  {
    users: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
      validate: [(v) => v.length === 2, 'A match must have exactly two users'],
      index: true,
    },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    matchType: { type: String, required: true },
    sharedStruggles: [String],
    sharedInterests: [String],
    sharedAgeGroup: { type: Boolean, default: false },

    conversationStarters: [String],

    // Lifecycle.
    isActive: { type: Boolean, default: true },
    endedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    endedAt: { type: Date, default: null },

    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

matchSchema.index({ users: 1, isActive: 1 });

// Returns the other participant's id given one participant.
matchSchema.methods.partnerOf = function partnerOf(userId) {
  return this.users.find((u) => u.toString() !== userId.toString());
};

matchSchema.methods.includes = function includes(userId) {
  return this.users.some((u) => u.toString() === userId.toString());
};

export default mongoose.model('Match', matchSchema);
