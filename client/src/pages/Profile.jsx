import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/common/Avatar.jsx';
import Badge from '../components/common/Badge.jsx';
import { Heart, ShieldCheck, EyeOff } from 'lucide-react';
import { fullDate } from '../utils/format.js';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="hc-card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-lavender-500 to-blush-400" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="rounded-full ring-4 ring-white">
              <Avatar name={user?.anonymousName} size="xl" />
            </div>
            <div className="pb-1">
              <h1 className="font-display text-2xl font-bold text-lavender-700">
                {user?.anonymousName}
              </h1>
              <p className="text-sm text-lavender-400">
                Joined {user?.joinedAt ? fullDate(user.joinedAt) : '—'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-lavender-50 px-4 py-3">
            <Heart className="h-5 w-5 text-blush-400" fill="currentColor" />
            <div>
              <p className="text-xs font-semibold text-lavender-400">Kindness score</p>
              <p className="font-display text-xl font-bold text-lavender-700">
                {user?.kindnessScore ?? 0}
              </p>
            </div>
          </div>

          {user?.badges?.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-lavender-400">
                Badges
              </p>
              <div className="flex flex-wrap gap-1.5">
                {user.badges.map((b) => (
                  <Badge key={b} label={b} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-lavender-400">
              Struggles
            </p>
            <div className="flex flex-wrap gap-1.5">
              {user?.struggles?.map((s) => (
                <span key={s} className="rounded-full bg-blush-100 px-2.5 py-1 text-xs font-semibold text-blush-500">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-lavender-400">
              Interests
            </p>
            <div className="flex flex-wrap gap-1.5">
              {user?.interests?.map((i) => (
                <span key={i} className="rounded-full bg-lavender-100 px-2.5 py-1 text-xs font-semibold text-lavender-700">
                  {i}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy reassurance */}
      <div className="hc-card p-5">
        <div className="flex items-center gap-2 font-display font-bold text-lavender-700">
          <ShieldCheck className="h-5 w-5" /> Your privacy
        </div>
        <ul className="mt-3 space-y-2 text-sm text-lavender-500">
          <li className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-lavender-400" /> Your real name and email are never shown
            to other users.
          </li>
          <li className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-lavender-400" /> Others can only ever see the profile
            above — your anonymous identity.
          </li>
        </ul>
      </div>
    </div>
  );
}
