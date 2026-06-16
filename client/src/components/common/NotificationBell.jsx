import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../../services/api.js';
import { timeAgo } from '../../utils/format.js';

export default function NotificationBell() {
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
      } catch {
        /* ignore */
      }
    }
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
              items.map((n) => (
                <div
                  key={n._id}
                  className="border-b border-lavender-50 px-4 py-3 last:border-0 hover:bg-lavender-50/60"
                >
                  <p className="text-sm font-bold text-lavender-700">{n.title}</p>
                  <p className="text-sm text-lavender-500">{n.body}</p>
                  <p className="mt-1 text-xs text-lavender-300">{timeAgo(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
