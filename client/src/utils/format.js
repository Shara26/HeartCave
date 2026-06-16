import { REACTIONS } from './constants.js';

// Friendly relative time, e.g. "just now", "5m", "3h", "2d", or a date.
export const timeAgo = (input) => {
  if (!input) return '';
  const date = new Date(input);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Clock time for chat bubbles.
export const clockTime = (input) =>
  new Date(input).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export const fullDate = (input) =>
  new Date(input).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

export const reactionByKey = (key) => REACTIONS.find((r) => r.key === key);

// Deterministic soft gradient for an avatar based on its text.
export const avatarGradient = (seed = '') => {
  const palettes = [
    'from-lavender-400 to-blush-300',
    'from-blush-300 to-lavender-400',
    'from-lavender-500 to-lavender-300',
    'from-blush-400 to-lavender-400',
    'from-lavender-300 to-blush-400',
  ];
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i);
  return palettes[sum % palettes.length];
};

export const initialsOf = (anonymousName = '?') => {
  const letters = anonymousName.replace(/[0-9]/g, '');
  return letters.slice(0, 2).toUpperCase() || '?';
};
