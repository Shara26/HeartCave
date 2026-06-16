import { REACTIONS } from '../../utils/constants.js';

// Shows the four supportive reactions with counts. Highlights the viewer's
// own reaction. Calls onReact(key) to toggle/switch.
export default function ReactionBar({ counts = {}, mine, onReact, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {REACTIONS.map((r) => {
        const active = mine === r.key;
        const count = counts[r.key] || 0;
        return (
          <button
            key={r.key}
            onClick={() => onReact?.(r.key)}
            disabled={disabled}
            title={r.label}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all
              ${active
                ? 'bg-gradient-to-r from-lavender-500 to-blush-400 text-white shadow-soft'
                : 'bg-lavender-50 text-lavender-600 hover:bg-lavender-100'} disabled:opacity-50`}
          >
            <span aria-hidden="true">{r.emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
