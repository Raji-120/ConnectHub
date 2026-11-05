import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, User, Smile, Loader2, Save, Sparkles, Check } from 'lucide-react';
import Avatar from '../common/Avatar';
import StatusIndicator from '../common/StatusIndicator';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [status, setStatus] = useState(user?.status || 'online');
  const [customStatus, setCustomStatus] = useState(user?.customStatus || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    const res = await updateProfile({
      name: name.trim(),
      avatar,
      status,
      customStatus: customStatus.trim(),
      bio: bio.trim(),
    });

    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } else {
      setError(res.error || 'Failed to update profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <User className="w-4 h-4" />
            </div>
            <span>Edit Profile</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {/* Avatar Preview & Options */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">
              Profile Avatar
            </label>
            <div className="flex items-center gap-3">
              <Avatar src={avatar} name={name} size="xl" status={status} />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition shrink-0 ${
                        avatar === url
                          ? 'border-brand-500 ring-2 ring-brand-500/40'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random()}`)
                    }
                    className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-brand-400 hover:text-white shrink-0"
                    title="Generate Bot"
                  >
                    🤖
                  </button>
                </div>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Or paste custom image URL"
                  className="mt-1.5 w-full px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-300 outline-none focus:border-brand-500 truncate"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-sm text-gray-100 outline-none transition"
            />
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1.5">
              Presence Status
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['online', 'away', 'busy', 'offline'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 capitalize transition border ${
                    status === s
                      ? 'bg-brand-500/20 border-brand-500/60 text-white'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <StatusIndicator status={s} size="sm" />
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1">
              Custom Status
            </label>
            <input
              type="text"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              placeholder="e.g. In a meeting 📞, Coding 💻"
              maxLength={100}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-sm text-gray-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1">
              Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your team about yourself..."
              maxLength={250}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-sm text-gray-100 outline-none transition resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
