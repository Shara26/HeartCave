import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Heart className="h-12 w-12 text-blush-400" fill="currentColor" />
      <h1 className="font-display text-3xl font-bold text-lavender-700">Page not found</h1>
      <p className="max-w-sm text-lavender-500">
        We couldn't find what you were looking for — but you're always welcome back home.
      </p>
      <Link to="/dashboard" className="hc-btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
