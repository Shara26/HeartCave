import { getProvider } from './index.js';

// AI FEATURE 4: 3–5 supportive, non-invasive conversation starters generated
// from shared context. Used once a connection is accepted.
export const generateStarters = async ({ sharedStruggles = [], sharedInterests = [] }) => {
  const provider = getProvider();
  const starters = await provider.conversationStarters({ sharedStruggles, sharedInterests });
  return Array.isArray(starters) ? starters.slice(0, 5) : [];
};

export default generateStarters;
