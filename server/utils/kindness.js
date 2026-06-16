import { BADGES } from '../config/constants.js';

// Translates raw rating + activity signals into a 0–100 kindness score and the
// set of badges a user has earned. Pure function so it is trivially testable.
//
// @param {object} stats
// @param {number} stats.positiveRatings  total positive ratings received
// @param {number} stats.goodListener     count of "Good Listener" ratings
// @param {number} stats.supportive       count of "Supportive" ratings
// @param {number} stats.helpfulComments  comments the user has authored
// @param {number} stats.conversations    completed conversations
export const computeKindness = (stats = {}) => {
  const {
    positiveRatings = 0,
    goodListener = 0,
    supportive = 0,
    helpfulComments = 0,
    conversations = 0,
  } = stats;

  // Weighted, then clamped to 100.
  const raw =
    positiveRatings * 4 +
    helpfulComments * 1 +
    conversations * 2;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const badges = new Set();
  if (goodListener >= 3) badges.add('Good Listener');
  if (supportive >= 3) badges.add('Supportive Friend');
  if (score >= 60 && positiveRatings >= 8) badges.add('Trusted Buddy');
  if (score >= 85 && positiveRatings >= 15) badges.add('Heart Hero');

  return {
    score,
    badges: BADGES.filter((b) => badges.has(b)), // keep canonical order
  };
};

// Reputation tier drives priority/restricted matching.
export const reputationTier = (score) => {
  if (score >= 70) return 'guide'; // priority matching, recognition
  if (score < 25) return 'review'; // restricted matching, monitoring
  return 'standard';
};

export default computeKindness;
