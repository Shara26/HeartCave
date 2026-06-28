import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, Mail } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import { Spinner } from '../components/common/Loading.jsx';
import AuthHero from '../components/common/AuthHero.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState(''); // only populated in development

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
      if (data.devResetUrl) setDevUrl(data.devResetUrl);
      toast.success('If that email exists, a reset link is on its way');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not send reset link'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-4 py-8 lg:grid-cols-2">
      <AuthHero />

      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center gap-2 lg:hidden">
          <Heart className="h-7 w-7 text-blush-400" fill="currentColor" />
          <span className="font-display text-2xl font-bold text-lavender-700">HeartCave</span>
        </div>

        <div className="hc-card p-7 animate-fade-up">
          <h2 className="font-display text-2xl font-bold text-lavender-700">Forgot your password?</h2>
          <p className="mt-1 text-sm text-lavender-500">
            Enter your email and we'll send you a link to reset it.
          </p>

          {sent ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-lavender-50 p-4 text-sm text-lavender-600">
                If an account exists for <strong>{email}</strong>, a reset link is on its way. The
                link is valid for one hour.
              </div>

              {devUrl && (
                <div className="rounded-2xl border border-dashed border-lavender-200 p-3 text-xs text-lavender-500">
                  <p className="mb-1 font-bold">Dev mode — no email server:</p>
                  <Link to={devUrl.replace(/^https?:\/\/[^/]+/, '')} className="break-all font-bold text-lavender-700 hover:underline">
                    Open reset link →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="hc-label" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lavender-300" />
                  <input
                    id="email"
                    type="email"
                    required
                    className="hc-input pl-9"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="hc-btn-primary w-full" disabled={busy}>
                {busy ? <Spinner size={18} /> : 'Send reset link'}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-lavender-500">
            Remembered it?{' '}
            <Link to="/login" className="font-bold text-lavender-700 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}