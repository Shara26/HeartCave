// Mirrors server/config/constants.js so the UI can render labels and chips
// without an extra round-trip. The /api/meta endpoint is the source of truth
// for the registration form; these are fallbacks + display helpers.

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

// Reaction keys must match server REACTIONS = ['support','relate','strong','inspire'].
export const REACTIONS = [
  { key: 'support', emoji: '❤️', label: 'Sending Support' },
  { key: 'relate', emoji: '🤗', label: 'I Relate' },
  { key: 'strong', emoji: '💪', label: 'Stay Strong' },
  { key: 'inspire', emoji: '🌟', label: 'You Inspire Me' },
];

export const BADGE_META = {
  'Good Listener': { emoji: '👂', tone: 'bg-lavender-100 text-lavender-700' },
  'Supportive Friend': { emoji: '🤝', tone: 'bg-blush-100 text-blush-500' },
  'Trusted Buddy': { emoji: '🛡️', tone: 'bg-lavender-100 text-lavender-700' },
  'Heart Hero': { emoji: '🏅', tone: 'bg-blush-100 text-blush-500' },
};

export const MATCH_TYPE_TONE = {
  'Perfect Match': 'bg-gradient-to-r from-lavender-500 to-blush-400 text-white',
  'Strong Match': 'bg-lavender-100 text-lavender-700',
  'Good Match': 'bg-blush-100 text-blush-500',
};

export const DISCLAIMER =
  'HeartCave is a peer-support platform — not a replacement for professional mental health care. ' +
  'It does not provide therapy, diagnosis, or emergency crisis intervention.';
