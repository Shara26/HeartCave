import User from '../models/User.js';
import Match from '../models/Match.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import MatchQueue from '../models/MatchQueue.js';
import Notification from '../models/Notification.js';
import { MATCH_WEIGHTS, MATCH_CATEGORY } from '../config/constants.js';
import { reputationTier } from '../utils/kindness.js';
import { explainMatch } from './ai/matchExplanationService.js';

const overlap = (a = [], b = []) => {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
};

const ratio = (shared, base) => (base.length ? shared.length / base.length : 0);

/**
 * Score two profiles 0–100 using struggles (60), interests (25), age (15).
 * Struggle/interest contributions are proportional to the seeker's profile so
 * that a full overlap on what the seeker cares about earns full weight.
 */
export const scorePair = (seeker, candidate) => {
  const sharedStruggles = overlap(seeker.struggles, candidate.struggles);
  const sharedInterests = overlap(seeker.interests, candidate.interests);
  const sameAge = seeker.ageGroup === candidate.ageGroup;

  const struggleScore = ratio(sharedStruggles, seeker.struggles) * MATCH_WEIGHTS.struggles;
  const interestScore = ratio(sharedInterests, seeker.interests) * MATCH_WEIGHTS.interests;
  const ageScore = sameAge ? MATCH_WEIGHTS.ageGroup : 0;

  const score = Math.round(struggleScore + interestScore + ageScore);
  return {
    score,
    matchType: MATCH_CATEGORY(score),
    sharedStruggles,
    sharedInterests,
    sharedAgeGroup: sameAge,
  };
};

/**
 * Find the best available candidates for a seeker.
 * Excludes: self, banned/suspended users, blocked users, anyone the seeker is
 * already matched with or has a pending request to.
 *
 * @returns {Array} ranked candidates with score breakdown (score >= 50 only)
 */
export const findCandidates = async (seekerId, { limit = 5 } = {}) => {
  const seeker = await User.findById(seekerId);
  if (!seeker) return [];

  // Users already connected or pending — exclude from new suggestions.
  const existingMatches = await Match.find({ users: seeker._id, isActive: true }).select('users');
  const matchedIds = new Set(
    existingMatches.flatMap((m) => m.users.map((u) => u.toString()))
  );
  const pending = await ConnectionRequest.find({
    $or: [{ from: seeker._id }, { to: seeker._id }],
    status: 'pending',
  }).select('from to');
  pending.forEach((r) => {
    matchedIds.add(r.from.toString());
    matchedIds.add(r.to.toString());
  });

  const exclude = [
    seeker._id,
    ...seeker.blockedUsers,
    ...Array.from(matchedIds).filter(Boolean),
  ];

  // Narrow the candidate pool to people who share *something* with the seeker.
  const pool = await User.find({
    _id: { $nin: exclude },
    role: 'user',
    isBanned: false,
    $or: [
      { struggles: { $in: seeker.struggles } },
      { interests: { $in: seeker.interests } },
      { ageGroup: seeker.ageGroup },
    ],
  }).limit(300);

  const scored = pool
    .filter((c) => !c.blockedUsers.some((b) => b.toString() === seeker._id.toString()))
    .filter((c) => !c.isSuspended())
    .map((c) => {
      const breakdown = scorePair(seeker, c);
      // Priority matching: nudge high-reputation guides slightly upward.
      const tier = reputationTier(c.kindnessScore);
      const adjusted = tier === 'guide' ? Math.min(100, breakdown.score + 3) : breakdown.score;
      return { candidate: c, ...breakdown, score: adjusted };
    })
    .filter((c) => c.score >= 50) // "Below 50 Ignore"
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Attach AI explanations.
  await Promise.all(
    scored.map(async (s) => {
      s.explanation = await explainMatch({
        sharedStruggles: s.sharedStruggles,
        sharedInterests: s.sharedInterests,
        sharedAgeGroup: s.sharedAgeGroup,
        score: s.score,
      });
    })
  );

  return scored;
};

/**
 * Low-user fallback: park the seeker in the queue so they can be matched
 * asynchronously when compatible users register later.
 */
export const enqueueSeeker = async (seeker) => {
  await MatchQueue.findOneAndUpdate(
    { user: seeker._id },
    {
      user: seeker._id,
      struggles: seeker.struggles,
      interests: seeker.interests,
      ageGroup: seeker.ageGroup,
      active: true,
      lastCheckedAt: new Date(),
    },
    { upsert: true, new: true }
  );
};

/**
 * Called when a new user registers. Recomputes pending queue entries and
 * notifies anyone who now has a good match — no need for either to be online.
 */
export const recalculateQueueForNewUser = async (newUser) => {
  const queued = await MatchQueue.find({ active: true, user: { $ne: newUser._id } });
  for (const entry of queued) {
    // eslint-disable-next-line no-await-in-loop
    const seeker = await User.findById(entry.user);
    if (!seeker || seeker.isBanned) continue;
    const breakdown = scorePair(seeker, newUser);
    if (breakdown.score >= 50) {
      // eslint-disable-next-line no-await-in-loop
      await Notification.create({
        user: seeker._id,
        type: 'match_found',
        title: 'Someone who understands just joined',
        body: 'We found a new person on a journey similar to yours. Open HeartCave to connect.',
        refId: newUser._id,
      });
      entry.active = false;
      entry.lastCheckedAt = new Date();
      // eslint-disable-next-line no-await-in-loop
      await entry.save();
    }
  }
};

export default findCandidates;
