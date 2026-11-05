import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { X, Key, Loader2 } from 'lucide-react';

export const JoinWorkspaceModal = ({ isOpen, onClose }) => {
  const { joinByInviteCode } = useWorkspace();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError('');

    const res = await joinByInviteCode(inviteCode.trim().toUpperCase());
    setLoading(false);

    if (res.success) {
      setInviteCode('');
      onClose();
    } else {
      setError(res.error || 'Failed to join workspace with this code');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <Key className="w-4 h-4" />
            </div>
            <span>Join a Workspace</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1.5">
              Enter Invite Code *
            </label>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. D24521BF"
              maxLength={12}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-sm font-mono tracking-wider text-gray-100 outline-none transition uppercase"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              Paste the 8-character code shared by your workspace admin.
            </p>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !inviteCode}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <span>Join Workspace</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinWorkspaceModal;
