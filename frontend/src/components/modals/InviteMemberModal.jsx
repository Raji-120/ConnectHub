import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import axiosClient from '../../api/axiosClient';
import { X, UserPlus, Copy, Check, Search, Shield, Loader2, Sparkles } from 'lucide-react';
import Avatar from '../common/Avatar';

export const InviteMemberModal = ({ isOpen, onClose }) => {
  const { currentWorkspace, inviteMember } = useWorkspace();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch registered users to display quick invite recommendations
    const fetchUsers = async () => {
      try {
        setSearchLoading(true);
        const res = await axiosClient.get('/auth/users');
        if (res.data?.success) {
          // Filter out users already in workspace
          const existingIds = new Set(
            currentWorkspace?.members?.map((m) => m.user?._id || m.user) || []
          );
          const eligible = (res.data.users || []).filter(
            (u) => !existingIds.has(u._id)
          );
          setRegisteredUsers(eligible);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setSearchLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, currentWorkspace]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (currentWorkspace?.inviteCode) {
      navigator.clipboard.writeText(currentWorkspace.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInvite = async (targetEmail, targetRole) => {
    const inviteEmail = targetEmail || email;
    if (!inviteEmail.trim()) {
      setError('Please provide a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const res = await inviteMember(inviteEmail.trim(), targetRole || role);
    setLoading(false);

    if (res.success) {
      setSuccess(res.message || 'User successfully added to workspace!');
      setEmail('');
      // Remove from suggestions
      setRegisteredUsers((prev) => prev.filter((u) => u.email !== inviteEmail));
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } else {
      setError(res.error || 'Failed to add user to workspace');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <span>Invite to {currentWorkspace?.name}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Workspace Invite Code Box */}
          <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Workspace Invite Code
              </span>
              <span className="font-mono text-base font-bold text-brand-400 tracking-wider">
                {currentWorkspace?.inviteCode || 'N/A'}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white flex items-center gap-1.5 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              {success}
            </div>
          )}

          {/* Form to Invite by Email */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInvite();
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-300 tracking-wider mb-1.5">
                Invite by Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-gray-950 border border-gray-800 focus:border-brand-500 text-sm text-gray-100 outline-none transition"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-300 font-medium outline-none focus:border-brand-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Member</span>
              )}
            </button>
          </form>

          {/* Quick Add from Registered Users */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Registered Users (Quick Add)
              </span>
            </div>

            {searchLoading ? (
              <div className="py-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                <span>Checking available users...</span>
              </div>
            ) : registeredUsers.length === 0 ? (
              <div className="py-3 text-center text-xs text-gray-500 bg-gray-950/40 rounded-xl border border-gray-800/60">
                All registered users are already members of this workspace.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {registeredUsers.map((regUser) => (
                  <div
                    key={regUser._id}
                    className="p-2 rounded-xl bg-gray-950/80 border border-gray-800 flex items-center justify-between hover:border-gray-700 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        src={regUser.avatar}
                        name={regUser.name}
                        size="sm"
                        status={regUser.status}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {regUser.name}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                          {regUser.email}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInvite(regUser.email, 'member')}
                      disabled={loading}
                      className="px-2.5 py-1 rounded-lg bg-brand-500/20 hover:bg-brand-500 text-brand-300 hover:text-white border border-brand-500/30 text-[11px] font-semibold transition shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberModal;
