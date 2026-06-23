import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, Lock } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import PasswordInput from '../components/common/PasswordInput.jsx';
import { Spinner } from '../components/common/Loading.jsx';
import AuthHero from '../components/common/AuthHero.jsx';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Could not reset password'));
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
          <h2 className="font-display text-2xl font-bold text-lavender-700">Set a new password</h2>
          <p className="mt-1 text-sm text-lavender-500">Choose a strong password you'll remember.</p>

          {!token ? (
            <div className="mt-6 rounded-2xl bg-blush-50 p-4 text-sm text-blush-500">
              This reset link is missing its token. Please request a new one from the{' '}
              <Link to="/forgot-password" className="font-bold underline">
                forgot password
              </Link>{' '}
              page.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="hc-label" htmlFor="password">
                  New password <span className="font-normal text-lavender-400">(min 8 characters)</span>
                </label>
                <PasswordInput
                  leftIcon={Lock}
                  id="password"
                  required
                  minLength={8}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="hc-label" htmlFor="confirm">Confirm password</label>
                <PasswordInput
                  leftIcon={Lock}
                  id="confirm"
                  required
                  minLength={8}
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              <button type="submit" className="hc-btn-primary w-full" disabled={busy}>
                {busy ? <Spinner size={18} /> : 'Reset password'}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-lavender-500">
            <Link to="/login" className="font-bold text-lavender-700 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}