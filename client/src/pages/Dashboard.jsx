import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, HandHeart, MessagesSquare, Search, Inbox, Heart } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/common/Avatar.jsx';
import Badge from '../components/common/Badge.jsx';
import CreatePost from '../components/posts/CreatePost.jsx';
import PostCard from '../components/posts/PostCard.jsx';
import { EmptyState, SkeletonList } from '../components/common/States.jsx';

function ProfileCard({ user }) {
  return (
    <div className="hc-card p-5">
      <div className="flex items-center gap-3">
        <Avatar name={user?.anonymousName} size="lg" />
        <div>
          <h2 className="font-display text-lg font-bold text-lavender-700">{user?.anonymousName}</h2>
          <p className="text-sm text-lavender-400">Age group {user?.ageGroup}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-lavender-50 px-4 py-3">
        <Heart className="h-5 w-5 text-blush-400" fill="currentColor" />
        <div>
          <p className="text-xs font-semibold text-lavender-400">Kindness score</p>
          <p className="font-display text-xl font-bold text-lavender-700">{user?.kindnessScore ?? 0}</p>
        </div>
      </div>

      {user?.badges?.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-lavender-400">Badges</p>
          <div className="flex flex-wrap gap-1.5">
            {user.badges.map((b) => (
              <Badge key={b} label={b} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-lavender-400">Struggles</p>
        <div className="flex flex-wrap gap-1.5">
          {user?.struggles?.map((s) => (
            <span key={s} className="rounded-full bg-blush-100 px-2.5 py-1 text-xs font-semibold text-blush-500">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-lavender-400">Interests</p>
        <div className="flex flex-wrap gap-1.5">
          {user?.interests?.map((i) => (
            <span key={i} className="rounded-full bg-lavender-100 px-2.5 py-1 text-xs font-semibold text-lavender-700">
              {i}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [hope, setHope] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    api
      .get('/hope')
      .then(({ data }) => setHope(data.message))
      .catch(() => setHope('You are not alone here.'));
  }, []);

  const loadPosts = useCallback(async (pageNum, q) => {
    const { data } = await api.get('/posts', { params: { page: pageNum, limit: 8, search: q } });
    return data;
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadPosts(1, query)
      .then((data) => {
        if (!active) return;
        setPosts(data.posts);
        setHasMore(data.hasMore);
        setPage(1);
      })
      .catch(() => active && setPosts([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query, loadPosts]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await loadPosts(page + 1, query);
      setPosts((p) => [...p, ...data.posts]);
      setHasMore(data.hasMore);
      setPage((n) => n + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const onSearch = (e) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Sidebar */}
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <ProfileCard user={user} />

        <div className="hc-card overflow-hidden">
          <div className="bg-gradient-to-r from-lavender-500 to-blush-400 px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-display font-bold">Daily Hope</span>
            </div>
            <p className="mt-2 font-display text-lg leading-snug">{hope}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <Link to="/match" className="hc-btn-primary w-full">
            <HandHeart className="h-4 w-4" /> Find Someone Who Understands
          </Link>
          <Link to="/requests" className="hc-btn-soft w-full">
            <Inbox className="h-4 w-4" /> Connection Requests
          </Link>
          <Link to="/chats" className="hc-btn-soft w-full">
            <MessagesSquare className="h-4 w-4" /> View Chats
          </Link>
        </div>
      </aside>

      {/* Feed */}
      <section className="space-y-5">
        <CreatePost onCreated={(p) => setPosts((prev) => [p, ...prev])} />

        <form onSubmit={onSearch} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lavender-300" />
          <input
            className="hc-input pl-9"
            placeholder="Search the support feed…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {loading ? (
          <SkeletonList count={4} />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No posts yet"
            description={
              query
                ? 'No posts match your search. Try a different word.'
                : 'Be the first to share something. Someone out there relates.'
            }
          />
        ) : (
          <>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button className="hc-btn-ghost" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
