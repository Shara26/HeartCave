import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Password field with a show/hide eye toggle.
 * - Pass `leftIcon` (a lucide icon component) to render an icon on the left,
 *   matching inputs that already have one (e.g. the Lock on the login page).
 * - All other props (id, value, onChange, placeholder, required, minLength…)
 *   are forwarded to the underlying <input>.
 */
export default function PasswordInput({ leftIcon: LeftIcon, className = '', ...props }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      {LeftIcon && (
        <LeftIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lavender-300" />
      )}
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={`hc-input pr-10 ${LeftIcon ? 'pl-9' : ''} ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-lavender-300 transition-colors hover:bg-lavender-50 hover:text-lavender-500"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}