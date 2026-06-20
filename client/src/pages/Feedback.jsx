import { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquareHeart, Send } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import { Spinner } from '../components/common/Loading.jsx';

const TYPES = ['Bug Report', 'Feature Request', 'General Feedback', 'Improvement Suggestion'];

export default function Feedback() {
  const [form, setForm] = useState({ name: '', email: '', type: 'General Feedback', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) {
      toast.error('Please write a message');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/feedback', form);
      toast.success('Thank you! Your feedback was submitted.');
      setForm({ name: '', email: '', type: 'General Feedback', message: '' });
    } catch (err) {
      toast.error(errorMessage(err, 'Could not submit feedback'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender-100">
          <MessageSquareHeart className="h-6 w-6 text-lavender-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-lavender-700">Feedback &amp; Suggestions</h1>
        <p className="mt-1 text-sm text-lavender-400">
          Found a bug or have an idea? We read every message. 💜
        </p>
      </div>

      <form onSubmit={submit} className="hc-card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="hc-label">
              Name <span className="text-lavender-300">(optional)</span>
            </label>
            <input
              className="hc-input"
              value={form.name}
              onChange={set('name')}
              maxLength={80}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="hc-label">
              Email <span className="text-lavender-300">(optional)</span>
            </label>
            <input
              className="hc-input"
              type="email"
              value={form.email}
              onChange={set('email')}
              maxLength={120}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="hc-label">Feedback type</label>
          <select className="hc-input" value={form.type} onChange={set('type')}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="hc-label">
            Message <span className="text-blush-500">*</span>
          </label>
          <textarea
            className="hc-input min-h-[140px] resize-y"
            value={form.message}
            onChange={set('message')}
            maxLength={2000}
            placeholder="Tell us what's on your mind…"
            required
          />
          <p className="mt-1 text-right text-xs text-lavender-300">{form.message.length}/2000</p>
        </div>

        <button type="submit" className="hc-btn-primary w-full" disabled={submitting}>
          {submitting ? <Spinner size={16} /> : <Send className="h-4 w-4" />}
          {submitting ? 'Sending…' : 'Submit feedback'}
        </button>
      </form>
    </div>
  );
}