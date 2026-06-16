import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HandHeart, Clock, Inbox } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import MatchCard from '../components/matching/MatchCard.jsx';
import { EmptyState, SkeletonList } from '../components/common/States.jsx';

export default function Matching() {
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [matches, setMatches] = useState([]);
  const [queued, setQueued] = useState(false);
  const [headline, setHeadline] = useState('');

  const find = async () => {
    setLoading(true);
    setSearched(true);
    setQueued(false);
    try {
      const { data } = await api.post('/match/find');
      setMatches(data.matches || []);
      setQueued(Boolean(data.queued));
      setHeadline(data.message || '');
      if (data.queued) toast('We\'ll notify you when someone joins', { icon: '🌱' });
    } catch (err) {
      toast.error(errorMessage(err, 'Matching is unavailable right now'));
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="hc-card overflow-hidden text-center">
        <div className="bg-gradient-to-br from-lavender-500 to-blush-400 px-6 py-10 text-white">
          <HandHeart className="mx-auto h-10 w-10" />
          <h1 className="mt-3 font-display text-2xl font-bold">Find Someone Who Understands</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/90">
            We match you with people navigating similar struggles and interests — not random
            strangers. You choose who to reach out to, and they choose to accept.
          </p>
          <button
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 font-display font-bold text-lavender-700 shadow-soft transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
            onClick={find}
            disabled={loading}
          >
            ❤️ {loading ? 'Searching…' : 'Find Someone Who Understands'}
          </button>
        </div>
      </div>

      {headline && !queued && matches.length > 0 && (
        <p className="text-center font-display text-lg font-bold text-lavender-700">{headline}</p>
      )}

      {loading && <SkeletonList count={2} />}

      {!loading && queued && (
        <EmptyState
          icon={Clock}
          title="Hang tight — your match is on the way"
          description="We couldn't find the right person yet. We'll notify you when someone with a similar journey joins HeartCave."
        />
      )}

      {!loading && searched && !queued && matches.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="No matches found"
          description="Try again in a little while as more people join the community."
        />
      )}

      {!loading && matches.length > 0 && (
        <div className="space-y-4">
          {matches.map((m) => (
            <MatchCard key={m.user.id} match={m} />
          ))}
          <p className="pt-1 text-center text-sm text-lavender-400">
            Sent a request?{' '}
            <Link to="/requests" className="font-bold text-lavender-700 hover:underline">
              Track it here
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
