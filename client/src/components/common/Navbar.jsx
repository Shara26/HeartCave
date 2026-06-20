import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Heart, LayoutDashboard, MessagesSquare, HandHeart, LogOut, UserRound, MessageSquareHeart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';
import Avatar from './Avatar.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/match', label: 'Find Support', icon: HandHeart },
  { to: '/chats', label: 'Chats', icon: MessagesSquare },
   { to: '/feedback', label: 'Feedback', icon: MessageSquareHeart },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-lavender-100 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-blush-400" fill="currentColor" />
          <span className="font-display text-xl font-bold text-lavender-700">HeartCave</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-lavender-100 text-lavender-700'
                    : 'text-lavender-500 hover:bg-lavender-50'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-lavender-50"
            title="Your profile"
          >
            <Avatar name={user?.anonymousName} size="sm" />
            <span className="hidden text-sm font-bold text-lavender-700 md:inline">
              {user?.anonymousName}
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-full p-2 text-lavender-400 transition-colors hover:bg-lavender-50 hover:text-blush-500"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center justify-around border-t border-lavender-50 px-2 py-1 sm:hidden">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `inline-flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                isActive ? 'text-lavender-700' : 'text-lavender-400'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `inline-flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              isActive ? 'text-lavender-700' : 'text-lavender-400'
            }`
          }
        >
          <UserRound className="h-5 w-5" />
          Profile
        </NavLink>
      </nav>
    </header>
  );
}
