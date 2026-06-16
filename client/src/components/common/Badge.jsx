import { BADGE_META } from '../../utils/constants.js';

export default function Badge({ label }) {
  const meta = BADGE_META[label] || { emoji: '✨', tone: 'bg-lavender-100 text-lavender-700' };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${meta.tone}`}
    >
      <span aria-hidden="true">{meta.emoji}</span>
      {label}
    </span>
  );
}
