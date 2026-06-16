import mongoose from 'mongoose';
import { RATING_TYPES } from '../config/constants.js';

// A post-conversation rating from one buddy to another. Drives kindness score.
const ratingSchema = new mongoose.Schema(
  {
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ratingTypes: [{ type: String, enum: RATING_TYPES }],
    note: { type: String, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

// One rating per rater per match.
ratingSchema.index({ matchId: 1, fromUser: 1 }, { unique: true });

export default mongoose.model('Rating', ratingSchema);
