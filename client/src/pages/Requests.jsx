import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, X, Inbox, Send, Sparkles } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import Avatar from '../components/common/Avatar.jsx';
import { EmptyState, SkeletonList } from '../components/common/States.jsx';
import { Spinner } from '../components/common/Loading.jsx';
import { timeAgo } from '../utils/format.js';

function RequestCard({ req, kind, onRespond, busyId }) {
  const u = req.user || {};
  const busy = busyId === req.id;
  return (
    <div className="hc-card p-5">
      <div className="flex items-start gap-3">
        <Avatar name={u.anonymousName} size="md" />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display font-bold text-lavender-700">{u.anonymousName}</span>
            <span className="rounded-full bg-lavender-100 px-2.5 py-0.5 text-xs font-bold text-lavender-700">
              {req.score}% · {req.matchType}
            </span>
          </div>
          <p className="text-xs text-lavender-400">{timeAgo(req.createdAt)}</p>

          {req.explanation && (
            <p className="mt-2 flex items-start gap-1.5 text-sm italic text-lavender-600">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blush-400" />
              {req.explanation}
            </p>
          )}

          {req.message && (
            <p className="mt-2 rounded-2xl bg-lavender-50 px-3 py-2 text-sm text-lavender-700">
              “{req.message}”
            </p>
          )}

          {req.sharedStruggles?.length > 0 && (
            <p className="mt-2 text-xs text-lavender-400">
              Shared: {[...(req.sharedStruggles || []), ...(req.sharedInterests || [])].join(', ')}
            </p>
          )}

          {kind === 'incoming' ? (
            <div className="mt-3 flex gap-2">
              <button
                className="hc-btn-primary flex-1"
                onClick={() => onRespond(req.id, 'accept')}
                disabled={busy}
              >
                {busy ? <Spinner size={16} /> : <Check className="h-4 w-4" />} Accept
              </button>
              <button
                className="hc-btn-soft flex-1"
                onClick={() => onRespond(req.id, 'reject')}
                disabled={busy}
              >
                <X className="h-4 w-4" /> Decline
              </button>
            </div>
          ) : (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-lavender-50 px-3 py-1 text-xs font-bold text-lavender-500">
              <Send className="h-3.5 w-3.5" /> Waiting for a response
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Requests() {
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/match/requests');
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (requestId, action) => {
    setBusyId(requestId);
    try {
      const { data } = await api.post('/match/respond', { requestId, action });
      setIncoming((list) => list.filter((r) => r.id !== requestId));
      if (action === 'accept') {
        toast.success('Connected! Opening your chat…');
        navigate(`/chats/${data.matchId}`);
      } else {
        toast('Request declined', { icon: '🤍' });
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Could not respond'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold text-lavender-700">Connection Requests</h1>
        <p className="text-sm text-lavender-500">
          Every conversation begins with a mutual yes. No unsolicited messages, ever.
        </p>
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display font-bold text-lavender-700">
          <Inbox className="h-5 w-5" /> Incoming
        </h2>
        {loading ? (
          <SkeletonList count={2} />
        ) : incoming.length === 0 ? (
          <EmptyState icon={Inbox} title="No incoming requests" description="When someone wants to connect, you'll see them here." />
        ) : (
          <div className="space-y-4">
            {incoming.map((r) => (
              <RequestCard key={r.id} req={r} kind="incoming" onRespond={respond} busyId={busyId} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display font-bold text-lavender-700">
          <Send className="h-5 w-5" /> Sent
        </h2>
        {loading ? (
          <SkeletonList count={1} />
        ) : outgoing.length === 0 ? (
          <EmptyState icon={Send} title="No pending sent requests" description="Head to Find Support to reach out to someone." />
        ) : (
          <div className="space-y-4">
            {outgoing.map((r) => (
              <RequestCard key={r.id} req={r} kind="outgoing" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
