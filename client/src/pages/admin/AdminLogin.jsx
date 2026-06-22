import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../../components/common/Loading.jsx';

export default function AdminLogin() {
  const { login, errorMessage } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role !== 'admin') {
        toast.error('This account is not a moderator account.');
        return;
      }
      toast.success('Welcome, moderator');
      navigate('/admin', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Could not sign in'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="hc-card p-8 animate-fade-up">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lavender-500 to-blush-400 text-white">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-lavender-700">
              Moderator Sign In
            </h1>
            <p className="mt-1 text-sm text-lavender-500">HeartCave safety & moderation console</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="hc-label">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lavender-300" />
                <input
                  type="email"
                  required
                  className="hc-input pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="hc-label">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lavender-300" />
                <input
                  type="password"
                  required
                  className="hc-input pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button className="hc-btn-primary w-full" disabled={busy}>
              {busy ? <Spinner size={18} /> : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-lavender-400">
          <Link to="/login" className="font-bold hover:underline">
            Back to member sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
