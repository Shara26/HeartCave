import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/common/Loading.jsx';
import AuthHero from '../components/common/AuthHero.jsx';
import PasswordInput from '../components/common/PasswordInput.jsx';

export default function Login() {
  const { login, errorMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.anonymousName}`);
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Could not sign you in'));
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
          <h2 className="font-display text-2xl font-bold text-lavender-700">Welcome back</h2>
          <p className="mt-1 text-sm text-lavender-500">
            Sign in to reconnect with your support circle.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="hc-label" htmlFor="email">
                Email
              </label>
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

            <div>
              <label className="hc-label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lavender-300" />
                <PasswordInput
                leftIcon={Lock}
                id="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              </div>
            </div>

            <button type="submit" className="hc-btn-primary w-full" disabled={busy}>
              {busy ? <Spinner size={18} /> : 'Sign in'}
            </button>
          </form>



          <p className="mt-3 text-center text-sm">
            <Link to="/forgot-password" className="font-bold text-lavender-600 hover:underline">
              Forgot password?
            </Link>
          </p>

          <p className="mt-5 text-center text-sm text-lavender-500">
            New to HeartCave?{' '}
            <Link to="/register" className="font-bold text-lavender-700 hover:underline">
              Create an account
            </Link>
          </p>
        </div>

      
      </div>
    </div>
  );
}
