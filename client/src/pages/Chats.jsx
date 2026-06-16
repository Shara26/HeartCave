import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessagesSquare, ChevronRight, HandHeart } from 'lucide-react';
import api from '../services/api.js';
import Avatar from '../components/common/Avatar.jsx';
import { EmptyState, SkeletonList } from '../components/common/States.jsx';
import { timeAgo } from '../utils/format.js';

export default function Chats() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/match')
      .then(({ data }) => setMatches(data.matches || []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-lavender-700">Your Conversations</h1>
        <p className="text-sm text-lavender-500">Private, one-to-one, and only with people you connected with.</p>
      </header>

      {loading ? (
        <SkeletonList count={3} />
      ) : matches.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No conversations yet"
          description="Once you connect with someone, your chat will appear here."
          action={
            <Link to="/match" className="hc-btn-primary mt-1">
              <HandHeart className="h-4 w-4" /> Find Support
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <Link
              key={m.matchId}
              to={`/chats/${m.matchId}`}
              className="hc-card flex items-center gap-3 p-4 transition-transform hover:scale-[1.01]"
            >
              <Avatar name={m.partner?.anonymousName} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-lavender-700">
                    {m.partner?.anonymousName}
                  </span>
                  <span className="text-xs text-lavender-400">
                    {m.lastMessageAt ? timeAgo(m.lastMessageAt) : timeAgo(m.createdAt)}
                  </span>
                </div>
                <p className="truncate text-sm text-lavender-400">
                  {m.matchType} · {m.score}% ·{' '}
                  {(m.sharedStruggles || []).slice(0, 2).join(', ') || 'Start the conversation'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-lavender-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
