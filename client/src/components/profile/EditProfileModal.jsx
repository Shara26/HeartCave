import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../common/Modal.jsx';
import ChipSelect from '../common/ChipSelect.jsx';
import { Spinner } from '../common/Loading.jsx';
import {
  AGE_GROUPS as FALLBACK_AGES,
  STRUGGLES as FALLBACK_STRUGGLES,
  INTERESTS as FALLBACK_INTERESTS,
} from '../../utils/constants.js';

export default function EditProfileModal({ open, onClose }) {
  const { user, setUser } = useAuth();

  const [meta, setMeta] = useState({
    ageGroups: FALLBACK_AGES,
    struggles: FALLBACK_STRUGGLES,
    interests: FALLBACK_INTERESTS,
  });
  const [form, setForm] = useState({
    ageGroup: '',
    interests: [],
    struggles: [],
    customInterests: '',
    customStruggles: '',
  });
  const [saving, setSaving] = useState(false);

  // Load option lists once.
  useEffect(() => {
    api
      .get('/meta')
      .then(({ data }) =>
        setMeta({ ageGroups: data.ageGroups, struggles: data.struggles, interests: data.interests })
      )
      .catch(() => {});
  }, []);

  // Pre-fill from the current user every time the modal opens.
  useEffect(() => {
    if (open && user) {
      setForm({
        ageGroup: user.ageGroup || '',
        interests: user.interests || [],
        struggles: user.struggles || [],
        customInterests: (user.customInterests || []).join(', '),
        customStruggles: (user.customStruggles || []).join(', '),
      });
    }
  }, [open, user]);

  const toggle = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const splitCsv = (str) =>
    str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);

  const save = async () => {
    const customStruggles = splitCsv(form.customStruggles);
    if (form.struggles.length + customStruggles.length === 0) {
      toast.error('Keep at least one struggle so we can match you');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.patch('/users/me', {
        ageGroup: form.ageGroup,
        interests: form.interests,
        struggles: form.struggles,
        customInterests: splitCsv(form.customInterests),
        customStruggles,
      });
      setUser(data.user); // instant UI update everywhere
      toast.success('Profile updated');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={() => !saving && onClose()} title="Edit profile">
      <div className="space-y-5">
        <div>
          <label className="hc-label">Age group</label>
          <div className="flex flex-wrap gap-2">
            {meta.ageGroups.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => set('ageGroup', g)}
                className={`hc-chip ${form.ageGroup === g ? 'hc-chip-on' : 'hc-chip-off'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="hc-label">What are you navigating right now?</label>
          <ChipSelect
            options={meta.struggles}
            selected={form.struggles}
            onToggle={(v) => toggle('struggles', v)}
            custom={form.customStruggles}
            onCustomChange={(v) => set('customStruggles', v)}
          />
        </div>

        <div>
          <label className="hc-label">Your interests</label>
          <ChipSelect
            options={meta.interests}
            selected={form.interests}
            onToggle={(v) => toggle('interests', v)}
            custom={form.customInterests}
            onCustomChange={(v) => set('customInterests', v)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button className="hc-btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="hc-btn-primary" onClick={save} disabled={saving}>
            {saving ? <Spinner size={16} /> : 'Save changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}