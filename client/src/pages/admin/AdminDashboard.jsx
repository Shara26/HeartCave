import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck, Users, FileWarning, Flag, LogOut, Search, Ban, Undo2,
  AlertTriangle, Clock, MessageSquareWarning, BarChart3, Check, X, Eye,
  MessageSquareHeart, Trash2, Inbox,
} from 'lucide-react';
import api, { errorMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../../components/common/Loading.jsx';
import { EmptyState } from '../../components/common/States.jsx';
import Modal from '../../components/common/Modal.jsx';
import { timeAgo, clockTime } from '../../utils/format.js';

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'reports', label: 'Reports', icon: Flag },
  { key: 'moderation', label: 'Moderation', icon: MessageSquareWarning },
   { key: 'feedback', label: 'Feedback', icon: MessageSquareHeart },
];

function StatCard({ label, value, accent }) {
  return (
    <div className="hc-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-lavender-400">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${accent || 'text-lavender-700'}`}>
        {value ?? 0}
      </p>
    </div>
  );
}

// ---- Overview ----
function Overview() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);
  if (!stats)
    return (
      <div className="flex justify-center py-10">
        <Spinner size={28} />
      </div>
    );
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Active (7d)" value={stats.activeUsers} />
        <StatCard label="Total Posts" value={stats.totalPosts} />
        <StatCard label="Total Matches" value={stats.totalMatches} />
        <StatCard label="Total Messages" value={stats.totalMessages} />
        <StatCard label="Flagged Messages" value={stats.flaggedMessages} accent="text-blush-500" />
        <StatCard label="Suspended" value={stats.suspendedUsers} accent="text-blush-500" />
        <StatCard label="Banned" value={stats.bannedUsers} accent="text-blush-500" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="hc-card p-5">
          <h3 className="mb-3 font-display font-bold text-lavender-700">Reports</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-lavender-50 p-3">
              <p className="font-display text-xl font-bold text-lavender-700">{stats.totalReports}</p>
              <p className="text-xs text-lavender-400">Total</p>
            </div>
            <div className="rounded-2xl bg-blush-100 p-3">
              <p className="font-display text-xl font-bold text-blush-500">{stats.openReports}</p>
              <p className="text-xs text-lavender-400">Open</p>
            </div>
            <div className="rounded-2xl bg-lavender-50 p-3">
              <p className="font-display text-xl font-bold text-lavender-700">{stats.resolvedReports}</p>
              <p className="text-xs text-lavender-400">Resolved</p>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-lavender-500">
            <Clock className="h-4 w-4" /> Avg resolution: {stats.avgResolutionHours ?? 0}h
          </p>
        </div>

        <div className="hc-card p-5">
          <h3 className="mb-3 font-display font-bold text-lavender-700">Most reported categories</h3>
          {stats.mostReportedCategories?.length ? (
            <ul className="space-y-2">
              {stats.mostReportedCategories.map((c) => (
                <li key={c.reason} className="flex items-center justify-between text-sm">
                  <span className="text-lavender-600">{c.reason}</span>
                  <span className="rounded-full bg-lavender-100 px-2 py-0.5 text-xs font-bold text-lavender-700">
                    {c.count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-lavender-400">No reports yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- User actions (shared) ----
function useUserActions(refresh) {
  const act = async (fn, okMsg) => {
    try {
      await fn();
      toast.success(okMsg);
      refresh?.();
    } catch (err) {
      toast.error(errorMessage(err, 'Action failed'));
    }
  };
  return {
    ban: (id) => act(() => api.put(`/admin/users/${id}/ban`, { reason: 'Banned by moderator' }), 'User banned'),
    unban: (id) => act(() => api.put(`/admin/users/${id}/unban`), 'User reinstated'),
    warn: (id) => act(() => api.put(`/admin/users/${id}/warn`, { reason: 'Warning by moderator' }), 'Warning recorded'),
    suspend: (id) => act(() => api.put(`/admin/users/${id}/suspend`, { hours: 24 }), 'User suspended 24h'),
  };
}

// ---- Users ----
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { search: query, limit: 50 } });
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const actions = useUserActions(load);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim());
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lavender-300" />
        <input
          className="hc-input pl-9"
          placeholder="Search by anonymous name, real name, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size={26} />
        </div>
      ) : (
        <div className="hc-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-lavender-50 text-left text-xs uppercase tracking-wide text-lavender-400">
                <tr>
                  <th className="px-4 py-3">Anonymous</th>
                  <th className="px-4 py-3">Real identity</th>
                  <th className="px-4 py-3">Kindness</th>
                  <th className="px-4 py-3">Strikes</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-lavender-50">
                    <td className="px-4 py-3 font-bold text-lavender-700">{u.anonymousName}</td>
                    <td className="px-4 py-3 text-lavender-500">
                      <div>{u.name}</div>
                      <div className="text-xs text-lavender-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">{u.kindnessScore}</td>
                    <td className="px-4 py-3">{u.violations}</td>
                    <td className="px-4 py-3">
                      {u.isBanned ? (
                        <span className="rounded-full bg-blush-100 px-2 py-0.5 text-xs font-bold text-blush-500">Banned</span>
                      ) : u.suspendedUntil && new Date(u.suspendedUntil) > new Date() ? (
                        <span className="rounded-full bg-lavender-100 px-2 py-0.5 text-xs font-bold text-lavender-700">Suspended</span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-600">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {u.role !== 'admin' && (
                          <>
                            <button onClick={() => actions.warn(u.id)} title="Warn" className="rounded-lg p-1.5 text-lavender-400 hover:bg-lavender-50">
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                            <button onClick={() => actions.suspend(u.id)} title="Suspend 24h" className="rounded-lg p-1.5 text-lavender-400 hover:bg-lavender-50">
                              <Clock className="h-4 w-4" />
                            </button>
                            {u.isBanned ? (
                              <button onClick={() => actions.unban(u.id)} title="Unban" className="rounded-lg p-1.5 text-green-500 hover:bg-green-50">
                                <Undo2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <button onClick={() => actions.ban(u.id)} title="Ban" className="rounded-lg p-1.5 text-blush-500 hover:bg-blush-100">
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <p className="py-8 text-center text-sm text-lavender-400">No users found.</p>}
        </div>
      )}
    </div>
  );
}

// ---- Reports ----
function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [viewMatch, setViewMatch] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/reports', { params: status ? { status } : {} });
      setReports(data.reports || []);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const actions = useUserActions(load);

  const resolve = async (id, newStatus) => {
    try {
      await api.put(`/admin/reports/${id}`, { status: newStatus });
      toast.success(`Report ${newStatus}`);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update report'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['open', 'under_review', 'resolved', 'dismissed', ''].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            className={`hc-chip ${status === s ? 'hc-chip-on' : 'hc-chip-off'}`}
          >
            {s ? s.replace('_', ' ') : 'all'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size={26} />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState icon={Flag} title="No reports here" description="Nothing in this queue right now." />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r._id} className="hc-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lavender-700">{r.reason}</span>
                    {r.priority === 'high' && (
                      <span className="rounded-full bg-blush-100 px-2 py-0.5 text-xs font-bold text-blush-500">
                        High priority
                      </span>
                    )}
                    <span className="rounded-full bg-lavender-100 px-2 py-0.5 text-xs font-bold text-lavender-700">
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-lavender-500">
                    Reported user:{' '}
                    <span className="font-bold text-lavender-700">
                      {r.reportedUser?.anonymousName}
                    </span>{' '}
                    <span className="text-xs text-lavender-400">
                      ({r.reportedUser?.name} · {r.reportedUser?.email})
                    </span>
                  </p>
                  <p className="text-xs text-lavender-400">
                    by {r.reportedBy?.anonymousName} · {timeAgo(r.createdAt)}
                  </p>
                  {r.description && (
                    <p className="mt-2 rounded-2xl bg-lavender-50 px-3 py-2 text-sm text-lavender-700">
                      {r.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button className="hc-btn-soft text-xs" onClick={() => resolve(r._id, 'under_review')}>
                  <Eye className="h-3.5 w-3.5" /> Review
                </button>
                <button className="hc-btn-soft text-xs" onClick={() => resolve(r._id, 'resolved')}>
                  <Check className="h-3.5 w-3.5" /> Resolve
                </button>
                <button className="hc-btn-soft text-xs" onClick={() => resolve(r._id, 'dismissed')}>
                  <X className="h-3.5 w-3.5" /> Dismiss
                </button>
                {r.reportedUser && !r.reportedUser.isBanned && (
                  <>
                    <button className="hc-btn-soft text-xs" onClick={() => actions.warn(r.reportedUser._id)}>
                      <AlertTriangle className="h-3.5 w-3.5" /> Warn
                    </button>
                    <button className="hc-btn-soft text-xs" onClick={() => actions.ban(r.reportedUser._id)}>
                      <Ban className="h-3.5 w-3.5" /> Ban user
                    </button>
                  </>
                )}
                {r.matchId && (
                  <button className="hc-btn-soft text-xs" onClick={() => setViewMatch(r.matchId)}>
                    <MessageSquareWarning className="h-3.5 w-3.5" /> View chat log
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ChatLogModal matchId={viewMatch} onClose={() => setViewMatch(null)} />
    </div>
  );
}

function ChatLogModal({ matchId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    api
      .get(`/admin/matches/${matchId}/messages`)
      .then(({ data }) => setMessages(data.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [matchId]);

  return (
    <Modal open={Boolean(matchId)} onClose={onClose} title="Conversation log" maxWidth="max-w-lg">
      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : messages.length === 0 ? (
        <p className="py-4 text-center text-sm text-lavender-400">No messages.</p>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {messages.map((m) => (
            <div key={m._id} className="rounded-2xl bg-lavender-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-lavender-700">
                  {m.senderId?.anonymousName}{' '}
                  <span className="font-normal text-lavender-400">({m.senderId?.name})</span>
                </span>
                <span className="text-[10px] text-lavender-400">{clockTime(m.createdAt)}</span>
              </div>
              <p className="text-sm text-lavender-900">{m.content}</p>
              {m.moderationStatus && m.moderationStatus !== 'SAFE' && (
                <span className="mt-1 inline-block rounded-full bg-blush-100 px-2 py-0.5 text-[10px] font-bold text-blush-500">
                  {m.moderationStatus}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ---- Moderation logs ----
function ModerationTab() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/moderation', { params: status ? { status } : {} });
      setLogs(data.logs || []);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id, resolution) => {
    try {
      await api.put(`/admin/moderation/${id}`, { resolution });
      toast.success(`Marked ${resolution}`);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['', 'FLAGGED', 'BLOCKED', 'UNDER_REVIEW'].map((s) => (
          <button key={s || 'all'} onClick={() => setStatus(s)} className={`hc-chip ${status === s ? 'hc-chip-on' : 'hc-chip-off'}`}>
            {s || 'all'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size={26} />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title="No moderation logs" description="The AI moderation pipeline hasn't flagged anything in this view." />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log._id} className="hc-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blush-100 px-2 py-0.5 text-xs font-bold text-blush-500">
                  {log.status}
                </span>
                <span className="text-xs text-lavender-400">{log.sourceType}</span>
                <span className="text-xs text-lavender-400">· {timeAgo(log.createdAt)}</span>
                {log.resolution && (
                  <span className="rounded-full bg-lavender-100 px-2 py-0.5 text-xs font-bold text-lavender-700">
                    {log.resolution}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-lavender-500">
                User: <span className="font-bold text-lavender-700">{log.user?.anonymousName}</span>
                {log.reason ? ` · ${log.reason}` : ''}
              </p>
              {log.categories?.length > 0 && (
                <p className="mt-1 text-xs text-lavender-400">Categories: {log.categories.join(', ')}</p>
              )}
              {log.excerpt && (
                <p className="mt-2 rounded-2xl bg-lavender-50 px-3 py-2 text-sm text-lavender-700">
                  {log.excerpt}
                </p>
              )}
              {!log.resolution && (
                <div className="mt-3 flex gap-2">
                  <button className="hc-btn-soft text-xs" onClick={() => review(log._id, 'upheld')}>
                    <Check className="h-3.5 w-3.5" /> Uphold
                  </button>
                  <button className="hc-btn-soft text-xs" onClick={() => review(log._id, 'cleared')}>
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Feedback ----
const FEEDBACK_TYPES = ['Bug Report', 'Feature Request', 'General Feedback', 'Improvement Suggestion'];

function FeedbackTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/feedback/admin', { params: type ? { type } : {} });
      setItems(data.feedback);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not load feedback'));
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/feedback/admin/${id}`);
      setItems((list) => list.filter((x) => x.id !== id));
      toast.success('Feedback deleted');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setType('')} className={type === '' ? 'hc-chip-on' : 'hc-chip-off'}>
          All
        </button>
        {FEEDBACK_TYPES.map((t) => (
          <button key={t} onClick={() => setType(t)} className={type === t ? 'hc-chip-on' : 'hc-chip-off'}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No feedback yet"
          description={type ? `No "${type}" feedback.` : 'Submitted feedback will appear here.'}
        />
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <div key={f.id} className="hc-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="rounded-full bg-lavender-100 px-2.5 py-0.5 text-xs font-bold text-lavender-700">
                    {f.type}
                  </span>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-lavender-900">{f.message}</p>
                  <p className="mt-2 text-xs text-lavender-400">
                    {f.name || 'Anonymous'}
                    {f.email ? ` · ${f.email}` : ''} · {timeAgo(f.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => remove(f.id)}
                  disabled={deletingId === f.id}
                  className="rounded-full p-2 text-lavender-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  title="Delete feedback"
                >
                  {deletingId === f.id ? <Spinner size={16} /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-lavender-100 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-lavender-600" />
            <span className="font-display text-xl font-bold text-lavender-700">
              HeartCave Moderation
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-bold text-lavender-500 sm:inline">
              {user?.anonymousName}
            </span>
            <button onClick={handleLogout} className="rounded-full p-2 text-lavender-400 hover:bg-lavender-50 hover:text-blush-500" title="Log out">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-bold transition-colors ${
                tab === key ? 'bg-lavender-600 text-white shadow-soft' : 'bg-white text-lavender-600 hover:bg-lavender-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <Overview />}
        {tab === 'users' && <UsersTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'moderation' && <ModerationTab />}
        {tab === 'feedback' && <FeedbackTab />} 
      </div>
    </div>
  );
}
