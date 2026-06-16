import { getProvider } from './index.js';

// AI FEATURE 3: short, friendly "Why We Matched" explanation. Delegates copy
// generation to the active provider; returns a single short sentence.
export const explainMatch = async ({
  sharedStruggles = [],
  sharedInterests = [],
  sharedAgeGroup = false,
  score = 0,
}) => {
  const provider = getProvider();
  return provider.matchExplanation({ sharedStruggles, sharedInterests, sharedAgeGroup, score });
};

export default explainMatch;
