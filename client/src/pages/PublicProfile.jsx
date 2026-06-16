import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, UserX } from 'lucide-react';
import api from '../services/api.js';
import Avatar from '../components/common/Avatar.jsx';
import Badge from '../components/common/Badge.jsx';
import { EmptyState } from '../components/common/States.jsx';
import { FullPageLoader } from '../components/common/Loading.jsx';
import { fullDate } from '../utils/format.js';

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/users/${id}/profile`)
      .then(({ data }) => setProfile(data.profile))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <FullPageLoader message="Loading profile…" />;
  if (notFound || !profile)
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState icon={UserX} title="Profile unavailable" description="This person may have left HeartCave." />
      </div>
    );

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-bold text-lavender-500 hover:text-lavender-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="hc-card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-lavender-500 to-blush-400" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="rounded-full ring-4 ring-white">
              <Avatar name={profile.anonymousName} size="xl" />
            </div>
            <div className="pb-1">
              <h1 className="font-display text-2xl font-bold text-lavender-700">
                {profile.anonymousName}
              </h1>
              <p className="text-sm text-lavender-400">
                Joined {profile.joinedAt ? fullDate(profile.joinedAt) : '—'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-lavender-50 px-4 py-3">
            <Heart className="h-5 w-5 text-blush-400" fill="currentColor" />
            <div>
              <p className="text-xs font-semibold text-lavender-400">Kindness score</p>
              <p className="font-display text-xl font-bold text-lavender-700">
                {profile.kindnessScore ?? 0}
              </p>
            </div>
          </div>

          {profile.badges?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.badges.map((b) => (
                <Badge key={b} label={b} />
              ))}
            </div>
          )}

          <div className="mt-4">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-lavender-400">Struggles</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.struggles?.map((s) => (
                <span key={s} className="rounded-full bg-blush-100 px-2.5 py-1 text-xs font-semibold text-blush-500">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-lavender-400">Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests?.map((i) => (
                <span key={i} className="rounded-full bg-lavender-100 px-2.5 py-1 text-xs font-semibold text-lavender-700">
                  {i}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
