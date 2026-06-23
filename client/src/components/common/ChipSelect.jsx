import { useState } from 'react';

/**
 * A wrap of selectable chips plus an "Other" chip that reveals a free-text box.
 * - `options`        predefined values
 * - `selected`       array of chosen predefined values
 * - `onToggle(v)`    toggle a predefined value
 * - `custom`         comma-separated string of the user's own values
 * - `onCustomChange(str)` update that string
 * - `max`            optional cap on predefined selections
 */
export default function ChipSelect({ options, selected, onToggle, custom, onCustomChange, max }) {
  const [showOther, setShowOther] = useState(Boolean(custom));

  const toggleOther = () => {
    const next = !showOther;
    setShowOther(next);
    if (!next) onCustomChange(''); // clearing "Other" wipes the custom text
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button
              type="button"
              key={opt}
              onClick={() => onToggle(opt)}
              disabled={!on && max && selected.length >= max}
              className={`hc-chip ${on ? 'hc-chip-on' : 'hc-chip-off'} disabled:opacity-40`}
            >
              {opt}
            </button>
          );
        })}
        <button
          type="button"
          onClick={toggleOther}
          className={`hc-chip ${showOther ? 'hc-chip-on' : 'hc-chip-off'}`}
        >
          + Other
        </button>
      </div>

      {showOther && (
        <input
          className="hc-input"
          placeholder="Add your own, separated by commas"
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          maxLength={220}
        />
      )}
    </div>
  );
}