import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { Spinner } from '../components/common/Loading.jsx';
import AuthHero from '../components/common/AuthHero.jsx';
import {
  AGE_GROUPS as FALLBACK_AGES,
  STRUGGLES as FALLBACK_STRUGGLES,
  INTERESTS as FALLBACK_INTERESTS,
  DISCLAIMER,
} from '../utils/constants.js';

function ChipGroup({ options, selected, onToggle, max }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            onClick={() => onToggle(opt)}
            disabled={!on && max && selected.length >= max}
            className={`hc-chip ${on ? 'hc-chip-on' : 'hc-chip-off'} disabled:opacity-40`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function Register() {
  const { register, errorMessage } = useAuth();
  const navigate = useNavigate();

  const [meta, setMeta] = useState({
    ageGroups: FALLBACK_AGES,
    struggles: FALLBACK_STRUGGLES,
    interests: FALLBACK_INTERESTS,
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    ageGroup: '',
    interests: [],
    struggles: [],
     acceptedSafetyPolicy: true,
  });
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get('/meta')
      .then(({ data }) =>
        setMeta({ ageGroups: data.ageGroups, struggles: data.struggles, interests: data.interests })
      )
      .catch(() => {
        /* keep fallbacks */
      });
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggle = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.ageGroup) return toast.error('Please choose your age group');
    if (form.struggles.length === 0) return toast.error('Pick at least one struggle so we can match you');
    if (form.interests.length === 0) return toast.error('Pick at least one interest');
    if (!acceptPolicy) return toast.error('Please accept the Community Safety Policy');

    setBusy(true);
    try {
      const user = await register(form);
      toast.success(`Welcome to HeartCave, ${user.anonymousName}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create your account'));
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
          <h2 className="font-display text-2xl font-bold text-lavender-700">Create your space</h2>
          <p className="mt-1 text-sm text-lavender-500">
            You'll get an anonymous name automatically. Your real name stays private.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <label className="hc-label" htmlFor="name">
                Name <span className="font-normal text-lavender-400">(private — never shown)</span>
              </label>
              <input
                id="name"
                className="hc-input"
                required
                placeholder="Your name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>

            <div>
              <label className="hc-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="hc-input"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>

            <div>
              <label className="hc-label" htmlFor="password">
                Password <span className="font-normal text-lavender-400">(min 8 characters)</span>
              </label>
              <input
                id="password"
                type="password"
                className="hc-input"
                required
                minLength={8}
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
            </div>

            <div>
              <label className="hc-label">Age group</label>
              <div className="flex flex-wrap gap-2">
                {meta.ageGroups.map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => set('ageGroup', g)}
                    className={`hc-chip ${form.ageGroup === g ? 'hc-chip-on' : 'hc-chip-off'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="hc-label">What are you navigating right now?</label>
              <ChipGroup
                options={meta.struggles}
                selected={form.struggles}
                onToggle={(v) => toggle('struggles', v)}
              />
            </div>

            <div>
              <label className="hc-label">Your interests</label>
              <ChipGroup
                options={meta.interests}
                selected={form.interests}
                onToggle={(v) => toggle('interests', v)}
              />
            </div>

            {/* Community safety policy */}
            <div className="rounded-2xl bg-lavender-50 p-4">
              <div className="mb-2 flex items-center gap-2 font-bold text-lavender-700">
                <ShieldCheck className="h-4 w-4" /> Anonymous, but accountable
              </div>
              <p className="text-xs leading-relaxed text-lavender-500">
                Your identity is hidden from other users — your behavior is not. HeartCave has zero
                tolerance for harassment, bullying, threats, hate speech, or encouraging self-harm.
                Violations may lead to warnings, suspension, or permanent removal.
              </p>
              <label className="mt-3 flex items-start gap-2 text-sm font-semibold text-lavender-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-lavender-500"
                  checked={acceptPolicy}
                  onChange={(e) => setAcceptPolicy(e.target.checked)}
                />
                I accept the Community Safety Policy.
              </label>
            </div>

            <button type="submit" className="hc-btn-primary w-full" disabled={busy}>
              {busy ? <Spinner size={18} /> : 'Join HeartCave'}
            </button>

            <p className="text-center text-[11px] leading-relaxed text-lavender-400">{DISCLAIMER}</p>
          </form>

          <p className="mt-4 text-center text-sm text-lavender-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-lavender-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
