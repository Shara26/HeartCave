import { useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, UserPlus, Check } from 'lucide-react';
import api, { errorMessage } from '../../services/api.js';
import Avatar from '../common/Avatar.jsx';
import Badge from '../common/Badge.jsx';
import { Spinner } from '../common/Loading.jsx';
import { MATCH_TYPE_TONE } from '../../utils/constants.js';

export default function MatchCard({ match }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const u = match.user;

  const sendRequest = async () => {
    setBusy(true);
    try {
      await api.post('/match/request', { toUserId: u.id });
      setSent(true);
      toast.success('Connection request sent 💜');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not send request'));
    } finally {
      setBusy(false);
    }
  };

  const tone = MATCH_TYPE_TONE[match.matchType] || 'bg-lavender-100 text-lavender-700';

  return (
    <div className="hc-card p-5 animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={u.anonymousName} size="lg" />
          <div>
            <h3 className="font-display text-lg font-bold text-lavender-700">{u.anonymousName}</h3>
            <p className="text-sm text-lavender-400">Age group {u.ageGroup}</p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>
              {match.matchType}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-bold text-lavender-700">{match.score}%</div>
          <p className="text-xs text-lavender-400">compatibility</p>
        </div>
      </div>

      {/* Why We Matched */}
      <div className="mt-4 rounded-2xl bg-lavender-50 p-4">
        <div className="mb-2 flex items-center gap-1.5 font-bold text-lavender-700">
          <Sparkles className="h-4 w-4 text-blush-400" /> Why we matched
        </div>
        {match.explanation && (
          <p className="mb-3 text-sm italic text-lavender-600">{match.explanation}</p>
        )}
        <dl className="space-y-1.5 text-sm">
          {match.sharedStruggles?.length > 0 && (
            <div className="flex gap-2">
              <dt className="font-semibold text-lavender-500">Shared struggles:</dt>
              <dd className="text-lavender-700">{match.sharedStruggles.join(', ')}</dd>
            </div>
          )}
          {match.sharedInterests?.length > 0 && (
            <div className="flex gap-2">
              <dt className="font-semibold text-lavender-500">Shared interests:</dt>
              <dd className="text-lavender-700">{match.sharedInterests.join(', ')}</dd>
            </div>
          )}
          {match.sharedAgeGroup && (
            <div className="flex gap-2">
              <dt className="font-semibold text-lavender-500">Same age group:</dt>
              <dd className="text-lavender-700">{u.ageGroup}</dd>
            </div>
          )}
        </dl>
      </div>

      {u.badges?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {u.badges.map((b) => (
            <Badge key={b} label={b} />
          ))}
        </div>
      )}

      <button
        className={`mt-4 w-full ${sent ? 'hc-btn-soft' : 'hc-btn-primary'}`}
        onClick={sendRequest}
        disabled={busy || sent}
      >
        {busy ? (
          <Spinner size={16} />
        ) : sent ? (
          <>
            <Check className="h-4 w-4" /> Request sent
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" /> Send connection request
          </>
        )}
      </button>
    </div>
  );
}
