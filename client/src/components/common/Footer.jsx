import { Link } from 'react-router-dom';
import {
  Heart, MessageSquareHeart, Shield, FileText,
  HandHeart, LayoutDashboard, PenLine,
} from 'lucide-react';
import { DISCLAIMER } from '../../utils/constants.js';

const quickLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard', label: 'Create Post', icon: PenLine },
  { to: '/match', label: 'Find Support Buddy', icon: HandHeart },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-lavender-100 bg-white/60">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link to="/dashboard" className="inline-flex items-center gap-2">
              <Heart className="h-6 w-6 text-blush-400" fill="currentColor" />
              <span className="font-display text-xl font-bold text-lavender-700">HeartCave</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-lavender-500">
              A safe space for support, positivity, and meaningful conversations.
            </p>
          </div>

          <nav aria-label="Quick links">
            <h2 className="text-xs font-bold uppercase tracking-wide text-lavender-400">Quick Links</h2>
            <ul className="mt-3 space-y-2">
              {quickLinks.map(({ to, label, icon: Icon }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-lavender-600 transition-colors hover:text-lavender-800"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" /> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Support and legal">
            <h2 className="text-xs font-bold uppercase tracking-wide text-lavender-400">Support</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/feedback" className="inline-flex items-center gap-2 text-sm font-semibold text-lavender-600 transition-colors hover:text-lavender-800">
                  <MessageSquareHeart className="h-4 w-4" aria-hidden="true" /> Contact &amp; Feedback
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="inline-flex items-center gap-2 text-sm font-semibold text-lavender-600 transition-colors hover:text-lavender-800">
                  <Shield className="h-4 w-4" aria-hidden="true" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="inline-flex items-center gap-2 text-sm font-semibold text-lavender-600 transition-colors hover:text-lavender-800">
                  <FileText className="h-4 w-4" aria-hidden="true" /> Terms of Service
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-8 rounded-2xl bg-lavender-50 px-4 py-3 text-center text-xs leading-relaxed text-lavender-400">
          {DISCLAIMER}
        </p>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-lavender-100 pt-6 sm:flex-row">
          <p className="text-xs text-lavender-400">© {year} HeartCave. All rights reserved.</p>
          <p className="text-xs font-bold text-lavender-400">
            Made with <span className="text-blush-400" aria-hidden="true">❤️</span> by Shara
          </p>
        </div>
      </div>
    </footer>
  );
}