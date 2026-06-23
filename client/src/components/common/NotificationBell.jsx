import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../../services/api.js';
import { timeAgo } from '../../utils/format.js';

// Where each notification type should take the user when clicked.
function routeFor(n) {
  switch (n.type) {
    case 'connection_request':
      return n.refId ? `/requests?highlight=${n.refId}` : '/requests';
    case 'request_accepted':
      return n.refId ? `/chats/${n.refId}` : '/chats';
    case 'request_rejected':
      return '/requests';
    case 'match_found':
      return '/match';
    case 'moderation_alert':
    case 'admin_alert':
      return '/admin';
    default:
      return null; // 'system' etc. — no navigation
  }
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get('/users/notifications');
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      /* silent — non-critical */
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000); // light polling
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      try {
        await api.post('/users/notifications/read');
        setUnread(0);
        setItems((list) => list.map((x) => ({ ...x, read: true })));
      } catch {
        /* ignore */
      }
    }
  };

  const handleClick = async (n) => {
    setOpen(false);
    if (!n.read) {
      setItems((list) => list.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      try {
        const { data } = await api.post(`/users/notifications/${n._id}/read`);
        if (typeof data.unread === 'number') setUnread(data.unread);
      } catch {
        /* ignore */
      }
    }
    const to = routeFor(n);
    if (to) navigate(to);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative rounded-full p-2 text-lavender-500 transition-colors hover:bg-lavender-50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blush-400 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] animate-fade-up overflow-hidden rounded-2xl border border-lavender-100 bg-white shadow-soft">
          <div className="border-b border-lavender-100 px-4 py-3 font-display font-bold text-lavender-700">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-lavender-400">
                You're all caught up.
              </p>
            ) : (
              items.map((n) => {
                const clickable = routeFor(n) !== null;
                return (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`block w-full border-b border-lavender-50 px-4 py-3 text-left last:border-0 transition-colors hover:bg-lavender-50/60 ${
                      clickable ? 'cursor-pointer' : 'cursor-default'
                    } ${!n.read ? 'bg-lavender-50/40' : ''}`}
                  >
                    <p className="flex items-center gap-2 text-sm font-bold text-lavender-700">
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-blush-400" />}
                      {n.title}
                    </p>
                    <p className="text-sm text-lavender-500">{n.body}</p>
                    <p className="mt-1 text-xs text-lavender-300">{timeAgo(n.createdAt)}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}