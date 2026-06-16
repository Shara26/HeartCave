import { Heart, Users, ShieldCheck, Sparkles } from 'lucide-react';

const headlines = [
  "You're Not Alone.",
  'Every Heart Deserves To Be Heard.',
  'Find People Who Truly Understand.',
];

// Left-side emotional hero shown beside the auth forms on larger screens.
export default function AuthHero() {
  return (
    <div className="relative hidden flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-lavender-500 to-blush-400 p-10 text-white lg:flex">
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-8 h-56 w-56 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div className="mb-6 inline-flex items-center gap-2">
          <Heart className="h-8 w-8" fill="currentColor" />
          <span className="font-display text-2xl font-bold">HeartCave</span>
        </div>

        <div className="space-y-1">
          {headlines.map((h) => (
            <h1 key={h} className="font-display text-3xl font-bold leading-tight">
              {h}
            </h1>
          ))}
        </div>

        <p className="mt-5 max-w-sm text-white/90">
          HeartCave helps people connect with others facing similar challenges and build meaningful
          support friendships.
        </p>

        <ul className="mt-8 space-y-3 text-sm text-white/90">
          <li className="flex items-center gap-3">
            <Users className="h-5 w-5" /> Matched on what you're really going through
          </li>
          <li className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5" /> Anonymous to others, accountable to the community
          </li>
          <li className="flex items-center gap-3">
            <Sparkles className="h-5 w-5" /> Connect intentionally — never random stranger chat
          </li>
        </ul>

        <p className="mt-10 text-sm font-bold text-white/80">Made with ❤️ by Shara</p>
      </div>
    </div>
  );
}
