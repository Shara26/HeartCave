import mongoose from 'mongoose';
import { MATCH_CATEGORY } from '../config/constants.js';

// A ConnectionRequest is how two users intentionally connect. No chat is
// possible until a request is accepted — this enforces "no unsolicited DMs".
const connectionRequestSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    matchScore: { type: Number, required: true, min: 0, max: 100 },
    matchType: { type: String, required: true }, // Perfect/Strong/Good Match
    sharedStruggles: [String],
    sharedInterests: [String],
    sharedAgeGroup: { type: Boolean, default: false },
    explanation: { type: String, default: '' }, // AI-generated "why we matched"

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },

    // Set once accepted; links to the Match document that opens the chat room.
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },

    message: { type: String, maxlength: 300, default: '' }, // optional intro note
  },
  { timestamps: true }
);

// Prevent duplicate pending requests between the same pair (either direction).
connectionRequestSchema.index({ from: 1, to: 1, status: 1 });

connectionRequestSchema.virtual('category').get(function category() {
  return MATCH_CATEGORY(this.matchScore);
});

export default mongoose.model('ConnectionRequest', connectionRequestSchema);
