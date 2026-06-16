import { useState } from 'react';
import toast from 'react-hot-toast';
import { Heart } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import api, { errorMessage } from '../../services/api.js';
import { RATING_TYPES } from '../../utils/constants.js';

// Shown after leaving a conversation. Lets the user thank their buddy with
// one or more kindness traits, which feed the reputation + badge system.
export default function RatingModal({ open, onClose, toUserId, matchId, anonymousName, onDone }) {
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  const toggle = (t) =>
    setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  const submit = async () => {
    if (selected.length === 0) {
      onClose?.();
      return;
    }
    setBusy(true);
    try {
      // One rating record per trait keeps the backend model simple.
      await Promise.all(
        selected.map((ratingType) =>
          api.post('/users/ratings', { toUserId, matchId, ratingType })
        )
      );
      toast.success('Thanks for spreading kindness 💜');
      onDone?.();
      onClose?.();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not submit rating'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="How was your conversation?">
      <p className="mb-4 text-sm text-lavender-500">
        Recognize <span className="font-bold text-lavender-700">{anonymousName}</span> for how they
        showed up. This builds their kindness reputation.
      </p>

      <div className="flex flex-wrap gap-2">
        {RATING_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            className={`hc-chip ${selected.includes(t) ? 'hc-chip-on' : 'hc-chip-off'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button className="hc-btn-soft" onClick={onClose} disabled={busy}>
          Skip
        </button>
        <button className="hc-btn-primary" onClick={submit} disabled={busy}>
          <Heart className="h-4 w-4" fill="currentColor" />
          {busy ? 'Sending…' : 'Send kindness'}
        </button>
      </div>
    </Modal>
  );
}
