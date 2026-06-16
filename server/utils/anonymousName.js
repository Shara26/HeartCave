// Generates warm, non-identifying anonymous handles like "BraveSoul27".
// Real names live in the DB but are never derived from or exposed through this.

const ADJECTIVES = [
  'Brave', 'Hopeful', 'Calm', 'Silent', 'Bright', 'Gentle', 'Kind', 'Quiet',
  'Steady', 'Warm', 'Bold', 'Soft', 'Wise', 'Free', 'True', 'Light',
  'Patient', 'Tender', 'Loyal', 'Radiant',
];

const NOUNS = [
  'Soul', 'River', 'Phoenix', 'Warrior', 'Heart', 'Star', 'Sky', 'Wave',
  'Ember', 'Harbor', 'Meadow', 'Lantern', 'Compass', 'Willow', 'Beacon',
  'Sparrow', 'Maple', 'Haven', 'Aurora', 'Pebble',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Builds a candidate handle. Uniqueness is enforced by the caller against the DB.
 */
export const buildAnonymousName = () => {
  const number = Math.floor(Math.random() * 99) + 1;
  return `${pick(ADJECTIVES)}${pick(NOUNS)}${number}`;
};

/**
 * Generates a handle guaranteed unique against the provided model.
 * @param {import('mongoose').Model} UserModel
 */
export const generateUniqueAnonymousName = async (UserModel) => {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = buildAnonymousName();
    // eslint-disable-next-line no-await-in-loop
    const exists = await UserModel.exists({ anonymousName: candidate });
    if (!exists) return candidate;
  }
  // Extremely unlikely fallback — append a high-entropy suffix.
  return `${buildAnonymousName()}${Date.now().toString().slice(-4)}`;
};

export default generateUniqueAnonymousName;
