import { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, Send } from 'lucide-react';
import api, { errorMessage } from '../../services/api.js';
import Avatar from '../common/Avatar.jsx';
import Badge from '../common/Badge.jsx';
import ReactionBar from '../common/ReactionBar.jsx';
import { Spinner } from '../common/Loading.jsx';
import { timeAgo } from '../../utils/format.js';



export default function PostCard({ post }) {
  const [counts, setCounts] = useState(post.reactionCounts || {});
  const [mine, setMine] = useState(post.myReaction || null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null); // null = not loaded
  const [commentText, setCommentText] = useState('');
  const [isShare, setIsShare] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);

  const react = async (type) => {
    const prevMine = mine;
    const prevCounts = counts;
    // optimistic update
    const next = { ...counts };
    if (prevMine) next[prevMine] = Math.max(0, (next[prevMine] || 1) - 1);
    if (prevMine === type) {
      setMine(null);
    } else {
      next[type] = (next[type] || 0) + 1;
      setMine(type);
    }
    setCounts(next);
    try {
      const { data } = await api.post(`/posts/${post.id}/react`, { type });
      setCounts(data.reactionCounts);
    } catch (err) {
      setMine(prevMine);
      setCounts(prevCounts);
      toast.error(errorMessage(err, 'Could not react'));
    }
  };

  const openComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      setLoadingComments(true);
      try {
        const { data } = await api.get(`/posts/${post.id}/comments`);
        setComments(data.comments);
      } catch {
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    setPosting(true);
    try {
      const { data } = await api.post(`/posts/${post.id}/comment`, {
        content: text,
        isExperienceShare: isShare,
      });
      setComments((c) => [...(c || []), data.comment]);
      setCommentCount((n) => n + 1);
      setCommentText('');
      setIsShare(false);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not add comment'));
    } finally {
      setPosting(false);
    }
  };

  const author = post.author || {};

  return (
    <article className="hc-card p-5 animate-fade-up">
      <header className="flex items-center gap-3">
        <Avatar name={author.anonymousName} size="md" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-bold text-lavender-700">{author.anonymousName}</span>
            {(author.badges || []).slice(0, 1).map((b) => (
              <Badge key={b} label={b} />
            ))}
          </div>
          <span className="text-xs text-lavender-400">{timeAgo(post.createdAt)}</span>
        </div>
      </header>

      <p className="mt-3 whitespace-pre-wrap leading-relaxed text-lavender-900">{post.content}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <ReactionBar counts={counts} mine={mine} onReact={react} />
        <button
          onClick={openComments}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-lavender-500 transition-colors hover:bg-lavender-50"
        >
          <MessageCircle className="h-4 w-4" />
          {commentCount > 0 ? commentCount : 'Comment'}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 border-t border-lavender-100 pt-4">
          {loadingComments ? (
            <div className="flex justify-center py-3">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-3">
              {(comments || []).map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar name={c.author?.anonymousName} size="sm" />
                  <div className="flex-1 rounded-2xl bg-lavender-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-lavender-700">
                        {c.author?.anonymousName}
                      </span>
                      {c.isExperienceShare && (
                        <span className="rounded-full bg-blush-100 px-2 py-0.5 text-[10px] font-bold text-blush-500">
                          Experience
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-lavender-900">{c.content}</p>
                  </div>
                </div>
              ))}
              {comments && comments.length === 0 && (
                <p className="text-center text-sm text-lavender-400">
                  Be the first to offer some support.
                </p>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <input
              className="hc-input"
              placeholder="Offer a kind word…"
              value={commentText}
              maxLength={1000}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submitComment()}
            />
            <button className="hc-btn-primary px-3" onClick={submitComment} disabled={posting}>
              {posting ? <Spinner size={16} /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-lavender-500">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-lavender-500"
              checked={isShare}
              onChange={(e) => setIsShare(e.target.checked)}
            />
            Share this as my own experience
          </label>
        </div>
      )}
    </article>
  );
}
