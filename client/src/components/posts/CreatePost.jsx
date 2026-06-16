import { useState } from 'react';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import api, { errorMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../common/Avatar.jsx';
import { Spinner } from '../common/Loading.jsx';

export default function CreatePost({ onCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const text = content.trim();
    if (text.length < 3) return toast.error('Share a little more so others can relate');
    setBusy(true);
    try {
      const { data } = await api.post('/posts', { content: text });
      setContent('');
      toast.success('Shared with the community 💜');
      onCreated?.(data.post);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not post that'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hc-card p-5">
      <div className="flex gap-3">
        <Avatar name={user?.anonymousName} size="md" />
        <div className="flex-1">
          <textarea
            className="hc-input min-h-[88px] resize-none"
            placeholder="Share what's on your heart. What are you carrying today?"
            value={content}
            maxLength={2000}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-lavender-400">
              Posting as <span className="font-bold">{user?.anonymousName}</span>
            </span>
            <button className="hc-btn-primary" onClick={submit} disabled={busy}>
              {busy ? <Spinner size={16} /> : <Send className="h-4 w-4" />}
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
