import { rulesProvider } from './providers/rulesProvider.js';
import { openaiProvider } from './providers/openaiProvider.js';

// Provider abstraction. Controllers and services depend ONLY on getProvider();
// the concrete implementation is selected by the AI_PROVIDER env var. This is
// what lets HeartCave swap AI vendors without touching business logic.
const REGISTRY = {
  rules: rulesProvider,
  openai: openaiProvider,
};

export const getProvider = () => {
  const key = (process.env.AI_PROVIDER || 'rules').toLowerCase();
  const provider = REGISTRY[key];
  if (!provider) {
    console.warn(`⚠ Unknown AI_PROVIDER "${key}", using rules provider.`);
    return rulesProvider;
  }
  return provider;
};

export default getProvider;
