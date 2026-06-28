import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Flag, Ban, LogOut, Sparkles, AlertTriangle } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import { connectSocket } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/common/Avatar.jsx';
import Modal from '../components/common/Modal.jsx';
import ReportModal from '../components/common/ReportModal.jsx';
import RatingModal from '../components/chat/RatingModal.jsx';
import { FullPageLoader, Spinner } from '../components/common/Loading.jsx';
import { clockTime } from '../utils/format.js';

export default function ChatRoom() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const listRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [starters, setStarters] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [softWarning, setSoftWarning] = useState(null); // {suggestion} pending send

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const seenIds = useRef(new Set());

 const scrollToBottom = useCallback(() => {
    // Scroll ONLY the message list, never the page. Setting scrollTop on the
    // container avoids scrollIntoView pulling the whole window down.
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const addMessage = useCallback(
    (msg) => {
      if (seenIds.current.has(msg.id)) return;
      seenIds.current.add(msg.id);
      setMessages((m) => [...m, msg]);
      scrollToBottom();
    },
    [scrollToBottom]
  );

  // Load partner (from matches) + history (from chat endpoint).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [matchRes, chatRes] = await Promise.all([
          api.get('/match'),
          api.get(`/chat/${matchId}`),
        ]);
        if (!active) return;
        const found = (matchRes.data.matches || []).find((m) => m.matchId === matchId);
        setPartner(found?.partner || null);
        setStarters(chatRes.data.conversationStarters || []);
        const msgs = chatRes.data.messages || [];
        msgs.forEach((m) => seenIds.current.add(m.id));
        setMessages(msgs);
        // Mark partner messages as read.
        api.post(`/chat/${matchId}/read`).catch(() => {});
      } catch (err) {
        toast.error(errorMessage(err, 'This conversation is unavailable'));
        navigate('/chats', { replace: true });
      } finally {
        if (active) {
          setLoading(false);
          scrollToBottom();
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [matchId, navigate, scrollToBottom]);

  // Socket wiring.
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;
    socket.emit('join-room', { matchId });

    const onReceive = (payload) => {
      if (payload.matchId !== matchId) return;
      addMessage({
        id: payload.id,
        senderId: payload.senderId,
        isMine: String(payload.senderId) === String(user.id),
        content: payload.content,
        read: false,
        createdAt: payload.createdAt,
      });
      // If it's the partner's message and we're looking, mark read.
      if (String(payload.senderId) !== String(user.id)) {
        api.post(`/chat/${matchId}/read`).catch(() => {});
        socket.emit('message-read', { matchId });
      }
    };
    const onPresence = ({ userId, online: isOn }) => {
      if (partner && String(userId) === String(partner.id)) setOnline(Boolean(isOn));
    };
    const onOnline = ({ userId }) => onPresence({ userId, online: true });
    const onOffline = ({ userId }) => onPresence({ userId, online: false });
    const onTyping = ({ matchId: mId, userId }) => {
      if (mId === matchId && String(userId) !== String(user.id)) setPartnerTyping(true);
    };
    const onStopTyping = ({ matchId: mId }) => {
      if (mId === matchId) setPartnerTyping(false);
    };
    const onRead = ({ matchId: mId, userId }) => {
      if (mId === matchId && String(userId) !== String(user.id)) {
        setMessages((m) => m.map((msg) => (msg.isMine ? { ...msg, read: true } : msg)));
      }
    };
    const onBlocked = () => toast.error('Your message was blocked by our safety policy.');
    const onRoomError = ({ message }) => {
      toast.error(message || 'Cannot open this conversation');
      navigate('/chats', { replace: true });
    };

    socket.on('receive-message', onReceive);
    socket.on('presence', onPresence);
    socket.on('online', onOnline);
    socket.on('offline', onOffline);
    socket.on('typing', onTyping);
    socket.on('stop-typing', onStopTyping);
    socket.on('message-read', onRead);
    socket.on('message-blocked', onBlocked);
    socket.on('room-error', onRoomError);

    return () => {
      socket.emit('stop-typing', { matchId });
      socket.off('receive-message', onReceive);
      socket.off('presence', onPresence);
      socket.off('online', onOnline);
      socket.off('offline', onOffline);
      socket.off('typing', onTyping);
      socket.off('stop-typing', onStopTyping);
      socket.off('message-read', onRead);
      socket.off('message-blocked', onBlocked);
      socket.off('room-error', onRoomError);
    };
  }, [matchId, user.id, partner, addMessage, navigate]);

  const emitTyping = () => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('typing', { matchId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit('stop-typing', { matchId }), 1200);
  };

  // Push a message over the socket; relies on receive-message to render it.
  const pushMessage = (content) =>
    new Promise((resolve) => {
      const socket = socketRef.current;
      socket.emit('send-message', { matchId, content }, (ack) => resolve(ack));
    });

  const doSend = async (content) => {
    setSending(true);
    try {
      const ack = await pushMessage(content);
      if (!ack?.ok) {
        if (ack?.blocked) toast.error('Message blocked: it may violate our safety policy.');
        else toast.error(ack?.error || 'Could not send message');
        return false;
      }
      setDraft('');
      return true;
    } finally {
      setSending(false);
    }
  };

  // AI FEATURE 5: supportive-language check before sending.
  const handleSend = async () => {
    const content = draft.trim();
    if (!content) return;
    try {
      const { data } = await api.post('/chat/check', { content });
      if (data.needsReview) {
        setSoftWarning({ suggestion: data.suggestion, content });
        return;
      }
    } catch {
      /* if the check fails, fall through to normal send + server moderation */
    }
    await doSend(content);
  };

  const block = async () => {
    try {
      await api.post('/users/block', { userId: partner.id });
      toast.success(`You blocked ${partner.anonymousName}`);
      navigate('/chats', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Could not block'));
    }
  };

  const leave = async () => {
    try {
      await api.post(`/chat/${matchId}/leave`);
      setShowLeave(false);
      setShowRating(true); // invite a kindness rating
    } catch (err) {
      toast.error(errorMessage(err, 'Could not leave'));
    }
  };

  if (loading) return <FullPageLoader message="Opening your conversation…" />;

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-2xl flex-col">
      {/* Header with always-visible safety controls */}
      <div className="hc-card flex items-center gap-3 rounded-b-none p-4">
        <button onClick={() => navigate('/chats')} className="rounded-full p-1.5 text-lavender-400 hover:bg-lavender-50">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link to={partner ? `/users/${partner.id}` : '#'} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={partner?.anonymousName} size="md" online={online} />
          <div className="min-w-0">
            <p className="font-display font-bold text-lavender-700">{partner?.anonymousName}</p>
            <p className="text-xs text-lavender-400">
              {partnerTyping ? 'typing…' : online ? 'Online now' : 'Offline'}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowReport(true)} title="Report" className="rounded-full p-2 text-lavender-400 hover:bg-lavender-50 hover:text-blush-500">
            <Flag className="h-4 w-4" />
          </button>
          <button onClick={() => setShowBlock(true)} title="Block" className="rounded-full p-2 text-lavender-400 hover:bg-lavender-50 hover:text-blush-500">
            <Ban className="h-4 w-4" />
          </button>
          <button onClick={() => setShowLeave(true)} title="Leave conversation" className="rounded-full p-2 text-lavender-400 hover:bg-lavender-50 hover:text-blush-500">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto border-x border-lavender-100 bg-white/60 p-4"
      >
        {messages.length === 0 && (
          <div className="rounded-2xl bg-lavender-50 p-4">
            <div className="mb-2 flex items-center gap-1.5 font-bold text-lavender-700">
              <Sparkles className="h-4 w-4 text-blush-400" /> Conversation starters
            </div>
            <p className="mb-3 text-sm text-lavender-500">
              You both have a lot in common. Here are a few gentle ways to begin:
            </p>
            <div className="space-y-2">
              {starters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setDraft(s)}
                  className="w-full rounded-2xl border border-lavender-200 bg-white px-3 py-2 text-left text-sm text-lavender-700 transition-colors hover:bg-lavender-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                m.isMine
                  ? 'bg-gradient-to-r from-lavender-500 to-blush-400 text-white'
                  : 'bg-lavender-50 text-lavender-900'
              }`}
            >
              <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
              <p className={`mt-1 text-right text-[10px] ${m.isMine ? 'text-white/70' : 'text-lavender-400'}`}>
                {clockTime(m.createdAt)}
                {m.isMine && (m.read ? ' · Read' : ' · Sent')}
              </p>
            </div>
          </div>
        ))}
        {partnerTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-lavender-50 px-4 py-3">
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-lavender-300" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-lavender-300" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-lavender-300" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="hc-card flex items-center gap-2 rounded-t-none p-3">
        <input
          className="hc-input"
          placeholder="Write a kind, supportive message…"
          value={draft}
          maxLength={2000}
          onChange={(e) => {
            setDraft(e.target.value);
            emitTyping();
          }}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
        />
        <button className="hc-btn-primary px-4" onClick={handleSend} disabled={sending || !draft.trim()}>
          {sending ? <Spinner size={16} /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      {/* Supportive-language soft warning (AI Feature 5) */}
      <Modal open={Boolean(softWarning)} onClose={() => setSoftWarning(null)} title="A gentle check">
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-blush-100 p-4 text-blush-500">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold">{softWarning?.suggestion}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button className="hc-btn-soft" onClick={() => setSoftWarning(null)}>
            Edit message
          </button>
          <button
            className="hc-btn-primary"
            onClick={async () => {
              const content = softWarning.content;
              setSoftWarning(null);
              await doSend(content);
            }}
          >
            Send anyway
          </button>
        </div>
      </Modal>

      {/* Block confirm */}
      <Modal open={showBlock} onClose={() => setShowBlock(false)} title={`Block ${partner?.anonymousName}?`}>
        <p className="mb-5 text-sm text-lavender-500">
          They won't be able to message you, view this chat, request a connection, or match with you
          again. This is immediate.
        </p>
        <div className="flex justify-end gap-3">
          <button className="hc-btn-soft" onClick={() => setShowBlock(false)}>
            Cancel
          </button>
          <button className="hc-btn-primary" onClick={block}>
            <Ban className="h-4 w-4" /> Block
          </button>
        </div>
      </Modal>

      {/* Leave confirm */}
      <Modal open={showLeave} onClose={() => setShowLeave(false)} title="Leave this conversation?">
        <p className="mb-5 text-sm text-lavender-500">
          The conversation will end for both of you. You'll have a chance to recognize their
          kindness afterward.
        </p>
        <div className="flex justify-end gap-3">
          <button className="hc-btn-soft" onClick={() => setShowLeave(false)}>
            Stay
          </button>
          <button className="hc-btn-primary" onClick={leave}>
            <LogOut className="h-4 w-4" /> Leave
          </button>
        </div>
      </Modal>

      {partner && (
        <ReportModal
          open={showReport}
          onClose={() => setShowReport(false)}
          reportedUserId={partner.id}
          anonymousName={partner.anonymousName}
          matchId={matchId}
        />
      )}

      {partner && (
        <RatingModal
          open={showRating}
          onClose={() => {
            setShowRating(false);
            navigate('/chats', { replace: true });
          }}
          toUserId={partner.id}
          matchId={matchId}
          anonymousName={partner.anonymousName}
          onDone={() => navigate('/chats', { replace: true })}
        />
      )}
    </div>
  );
}
