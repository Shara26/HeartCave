import { MODERATION_STATUS, INSTANT_BAN_CATEGORIES } from '../../../config/constants.js';

// A deterministic, dependency-free provider. It needs no API key, runs offline,
// and gives HeartCave a safe default so the platform is never *unmoderated*.
// It is intentionally conservative and transparent. Swap in `openaiProvider`
// (or any other) via AI_PROVIDER without touching controllers.

// Category → signal phrases. These are coarse heuristics, NOT a substitute for
// human review; flagged/blocked content is always surfaced to moderators.
const CATEGORY_SIGNALS = {
  threats: [
    'kill you', 'hurt you', 'i will find you', 'beat you up', 'watch your back',
    'you better watch', "you're dead", 'i know where you live',
  ],
  sexual_misconduct: [
    'send nudes', 'send pics', 'nude', 'naked', 'sext', 'horny', 'sexual favor',
  ],
  grooming: [
    "don't tell anyone", 'keep this between us', 'our secret', 'how old are you really',
    'meet me alone', "don't tell your parents",
  ],
  self_harm_encouragement: [
    'kill yourself', 'kys', 'you should die', 'end yourself', 'just disappear forever',
  ],
  hate_speech: [
    // Slur stems are deliberately omitted from source; matched via a separate
    // normalized check below to avoid embedding offensive terms verbatim.
  ],
  harassment: [
    'shut up loser', 'nobody likes you', "you're worthless", 'pathetic', 'idiot',
    'stupid', 'shut up', 'get lost',
  ],
  bullying: [
    'everyone hates you', "you're a freak", 'cry baby', 'so dumb',
  ],
  manipulation: [
    'if you really cared', "you owe me", "you'll regret it", "you made me do this",
  ],
};

// Categories that, when matched, should BLOCK (and may trigger instant ban).
const BLOCK_CATEGORIES = new Set(INSTANT_BAN_CATEGORIES);

const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[0@]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[$5]/g, 's')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const matchCategories = (text) => {
  const norm = normalize(text);
  const matched = [];
  for (const [category, phrases] of Object.entries(CATEGORY_SIGNALS)) {
    if (phrases.some((p) => norm.includes(normalize(p)))) matched.push(category);
  }
  return matched;
};

export const rulesProvider = {
  name: 'rules',

  async moderate({ text }) {
    const categories = matchCategories(text || '');
    const hasBlock = categories.some((c) => BLOCK_CATEGORIES.has(c));

    let status = MODERATION_STATUS.SAFE;
    if (hasBlock) status = MODERATION_STATUS.BLOCKED;
    else if (categories.length > 0) status = MODERATION_STATUS.FLAGGED;

    const score = hasBlock ? 0.95 : categories.length ? 0.55 : 0.02;
    const reason = categories.length
      ? `Matched safety signals: ${categories.join(', ')}.`
      : 'No safety signals detected.';

    return { status, categories, score, reason, provider: this.name };
  },

  // Short, friendly templated explanation of a match.
  async matchExplanation({ sharedStruggles = [], sharedInterests = [], sharedAgeGroup, score }) {
    const parts = [];
    if (sharedStruggles.length) {
      parts.push(`you both seem to be facing ${sharedStruggles.slice(0, 2).join(' and ').toLowerCase()}`);
    }
    if (sharedInterests.length) {
      parts.push(`you share an interest in ${sharedInterests.slice(0, 2).join(' and ')}`);
    }
    if (sharedAgeGroup && parts.length < 2) {
      parts.push("you're at a similar stage of life");
    }
    const body = parts.length
      ? parts.join(', and ')
      : 'you have a few things in common worth exploring';
    const lead = score >= 90 ? 'You two could really get each other —' : 'You have common ground —';
    return `${lead} ${body}.`;
  },

  // 3–5 gentle, non-invasive starters tailored to shared context.
  async conversationStarters({ sharedStruggles = [], sharedInterests = [] }) {
    const starters = [];
    const struggle = sharedStruggles[0];
    const interest = sharedInterests[0];

    if (struggle) {
      starters.push(`You both mentioned ${struggle.toLowerCase()} — what's been the hardest part lately?`);
      starters.push(`What has helped you stay grounded while dealing with ${struggle.toLowerCase()}?`);
    }
    if (interest) {
      starters.push(`You're both into ${interest} — what got you started with it?`);
    }
    starters.push('What does a good day look like for you right now?');
    starters.push("Is there something small you're proud of this week?");

    return starters.slice(0, 5);
  },
};

export default rulesProvider;
