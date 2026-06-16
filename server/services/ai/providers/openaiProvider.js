import { MODERATION_STATUS } from '../../../config/constants.js';
import { rulesProvider } from './rulesProvider.js';

// OpenAI-backed provider. Uses the Moderations endpoint for safety and a small
// chat model for explanations/starters. If no key is configured or a call
// fails, it falls back to the rules provider so the platform stays moderated.
//
// NOTE: HeartCave never uses AI to give therapy/diagnosis. These calls only
// (a) classify safety and (b) produce short matching copy.

const API = 'https://api.openai.com/v1';

const hasKey = () => Boolean(process.env.OPENAI_API_KEY);

const chat = async (system, user) => {
  const res = await fetch(`${API}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 200,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI chat error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
};

// Map OpenAI moderation categories to HeartCave's block list.
const BLOCK_FLAGS = [
  'harassment/threatening',
  'hate/threatening',
  'sexual/minors',
  'self-harm/intent',
  'self-harm/instructions',
  'violence/graphic',
];

export const openaiProvider = {
  name: 'openai',

  async moderate({ text }) {
    if (!hasKey()) return rulesProvider.moderate({ text });
    try {
      const res = await fetch(`${API}/moderations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model: 'omni-moderation-latest', input: text }),
      });
      if (!res.ok) throw new Error(`OpenAI moderation error ${res.status}`);
      const data = await res.json();
      const result = data.results?.[0];
      if (!result) return rulesProvider.moderate({ text });

      const categories = Object.entries(result.categories || {})
        .filter(([, v]) => v)
        .map(([k]) => k);
      const maxScore = Math.max(0, ...Object.values(result.category_scores || { x: 0 }));
      const isBlock = categories.some((c) => BLOCK_FLAGS.includes(c));

      let status = MODERATION_STATUS.SAFE;
      if (isBlock) status = MODERATION_STATUS.BLOCKED;
      else if (result.flagged) status = MODERATION_STATUS.FLAGGED;

      return {
        status,
        categories,
        score: maxScore,
        reason: categories.length ? `Flagged: ${categories.join(', ')}` : 'No flags.',
        provider: this.name,
      };
    } catch (err) {
      console.warn('⚠ OpenAI moderation failed, falling back to rules:', err.message);
      return rulesProvider.moderate({ text });
    }
  },

  async matchExplanation(ctx) {
    if (!hasKey()) return rulesProvider.matchExplanation(ctx);
    try {
      const system =
        'You write one short, warm sentence (max 30 words) explaining why two ' +
        'anonymous peer-support users were matched. Be encouraging and specific. ' +
        'Never give therapy, advice, or diagnosis. No names.';
      const user = `Shared struggles: ${ctx.sharedStruggles?.join(', ') || 'none'}. ` +
        `Shared interests: ${ctx.sharedInterests?.join(', ') || 'none'}. ` +
        `Same age group: ${ctx.sharedAgeGroup ? 'yes' : 'no'}. Score: ${ctx.score}.`;
      const out = await chat(system, user);
      return out || rulesProvider.matchExplanation(ctx);
    } catch (err) {
      console.warn('⚠ OpenAI explanation failed, falling back:', err.message);
      return rulesProvider.matchExplanation(ctx);
    }
  },

  async conversationStarters(ctx) {
    if (!hasKey()) return rulesProvider.conversationStarters(ctx);
    try {
      const system =
        'Generate 3-5 short, supportive, non-invasive conversation starters for ' +
        'two anonymous peer-support users. One question per line, no numbering. ' +
        'Avoid sensitive assumptions. Never give therapy or advice.';
      const user = `Shared struggles: ${ctx.sharedStruggles?.join(', ') || 'none'}. ` +
        `Shared interests: ${ctx.sharedInterests?.join(', ') || 'none'}.`;
      const out = await chat(system, user);
      const lines = out.split('\n').map((l) => l.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean);
      return lines.length ? lines.slice(0, 5) : rulesProvider.conversationStarters(ctx);
    } catch (err) {
      console.warn('⚠ OpenAI starters failed, falling back:', err.message);
      return rulesProvider.conversationStarters(ctx);
    }
  },
};

export default openaiProvider;
