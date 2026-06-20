import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, Inbox } from 'lucide-react';
import api, { errorMessage } from '../../services/api.js';
import { Spinner } from '../../components/common/Loading.jsx';

const TYPES = ['Bug Report', 'Feature Request', 'General Feedback', 'Improvement Suggestion'];

export default function AdminFeedback() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/feedback/admin', { params: type ? { type } : {} });
      setItems(data.feedback);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not load feedback'));
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/feedback/admin/${id}`);
      setItems((list) => list.filter((x) => x.id !== id));
      toast.success('Feedback deleted');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          to="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-lavender-500 hover:text-lavender-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="font-display text-2xl font-bold text-lavender-700">Feedback</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setType('')} className={type === '' ? 'hc-chip-on' : 'hc-chip-off'}>
            All
          </button>
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} className={type === t ? 'hc-chip-on' : 'hc-chip-off'}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <div className="hc-card flex flex-col items-center gap-2 p-10 text-center text-lavender-400">
              <Inbox className="h-8 w-8" />
              <p>No feedback{type ? ` of type "${type}"` : ''} yet.</p>
            </div>
          ) : (
            items.map((f) => (
              <div key={f.id} className="hc-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="rounded-full bg-lavender-100 px-2.5 py-0.5 text-xs font-bold text-lavender-700">
                      {f.type}
                    </span>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-lavender-900">{f.message}</p>
                    <p className="mt-2 text-xs text-lavender-400">
                      {f.name || 'Anonymous'}
                      {f.email ? ` · ${f.email}` : ''} · {new Date(f.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(f.id)}
                    disabled={deletingId === f.id}
                    className="rounded-full p-2 text-lavender-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    title="Delete feedback"
                  >
                    {deletingId === f.id ? <Spinner size={16} /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}