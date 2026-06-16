// Central source of truth for the controlled vocabularies used across HeartCave.
// Keeping these here means the matching algorithm, validation, and seed data
// all agree on the exact same values.

export const AGE_GROUPS = ['13-17', '18-22', '23-30', '31-40', '40+'];

export const STRUGGLES = [
  'Placement Stress',
  'Career Anxiety',
  'Loneliness',
  'Family Problems',
  'Breakup',
  'Self Confidence',
  'GATE Preparation',
  'Academic Pressure',
  'Mental Burnout',
  'Social Anxiety',
];

export const INTERESTS = [
  'DSA',
  'Programming',
  'Reading',
  'Music',
  'Fitness',
  'Gaming',
  'Movies',
  'Travel',
  'Design',
  'Entrepreneurship',
];

export const REACTIONS = ['support', 'relate', 'strong', 'inspire']; // ❤️ 🤗 💪 🌟

export const REPORT_REASONS = [
  'Harassment',
  'Bullying',
  'Toxic Behaviour',
  'Hate Speech',
  'Sexual Harassment',
  'Spam',
  'Threats',
  'Manipulation',
  'Other',
];

export const RATING_TYPES = ['Good Listener', 'Respectful', 'Encouraging', 'Supportive'];

export const BADGES = ['Good Listener', 'Supportive Friend', 'Trusted Buddy', 'Heart Hero'];

// Matching weights — must sum to 100.
export const MATCH_WEIGHTS = {
  struggles: 60,
  interests: 25,
  ageGroup: 15,
};

export const MATCH_CATEGORY = (score) => {
  if (score >= 90) return 'Perfect Match';
  if (score >= 70) return 'Strong Match';
  if (score >= 50) return 'Good Match';
  return 'No Match';
};

export const DAILY_HOPE_MESSAGES = [
  'Small progress is still progress.',
  'Someone understands your struggle.',
  "You've survived every difficult day so far.",
  "Your story isn't over.",
  'You are allowed to take up space and to rest.',
  'Reaching out is a sign of strength, not weakness.',
  'The hardest part of any day is often just starting it.',
  'You are more than your worst moment.',
];

export const MODERATION_STATUS = {
  SAFE: 'SAFE',
  FLAGGED: 'FLAGGED',
  BLOCKED: 'BLOCKED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  REMOVED: 'REMOVED',
};

// Offenses that bypass the three-strike system and ban immediately.
export const INSTANT_BAN_CATEGORIES = [
  'threats',
  'sexual_misconduct',
  'grooming',
  'self_harm_encouragement',
  'hate_speech',
];
