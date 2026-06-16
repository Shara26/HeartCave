import { Heart } from 'lucide-react';

export function Spinner({ size = 20, className = '' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-lavender-200 border-t-lavender-500 ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

// Full-screen branded loader used during auth bootstrap / route transitions.
export function FullPageLoader({ message = 'Warming up the cave…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Heart className="h-10 w-10 animate-pulse-soft text-blush-400" fill="currentColor" />
      <p className="font-display text-lavender-500">{message}</p>
    </div>
  );
}

export default Spinner;
