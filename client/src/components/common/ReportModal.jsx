import { useState } from 'react';
import toast from 'react-hot-toast';
import { Flag } from 'lucide-react';
import Modal from './Modal.jsx';
import api, { errorMessage } from '../../services/api.js';
import { REPORT_REASONS } from '../../utils/constants.js';

// Reusable report dialog. Provide the reported user's id + anonymous name.
export default function ReportModal({ open, onClose, reportedUserId, anonymousName, matchId }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post('/users/reports', {
        reportedUserId,
        reason,
        description: description.trim(),
        matchId,
      });
      toast.success('Report submitted. Our team will review it.');
      setDescription('');
      onClose?.();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not submit report'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Report a concern">
      <p className="mb-4 text-sm text-lavender-500">
        You are reporting <span className="font-bold text-lavender-700">{anonymousName}</span>.
        Reports are confidential. Your identity is never shared with the other person.
      </p>

      <label className="hc-label">Reason</label>
      <select className="hc-input mb-4" value={reason} onChange={(e) => setReason(e.target.value)}>
        {REPORT_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label className="hc-label">What happened? (optional)</label>
      <textarea
        className="hc-input mb-5 min-h-[96px] resize-none"
        placeholder="Add any details that will help our moderators…"
        value={description}
        maxLength={1000}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex justify-end gap-3">
        <button className="hc-btn-soft" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button className="hc-btn-primary" onClick={submit} disabled={submitting}>
          <Flag className="h-4 w-4" />
          {submitting ? 'Submitting…' : 'Submit report'}
        </button>
      </div>
    </Modal>
  );
}
