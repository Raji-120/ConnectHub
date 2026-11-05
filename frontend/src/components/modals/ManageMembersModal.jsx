import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { X, Users, Crown, Shield, User, Trash2, Loader2, Check } from 'lucide-react';
import Avatar from '../common/Avatar';

export const ManageMembersModal = ({ isOpen, onClose }) => {
  const { currentWorkspace, userRole, updateMemberRole, removeMember } = useWorkspace();
  const { user: currentUser } = useAuth();

  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen || !currentWorkspace) return null;

  const isOwner = userRole === 'owner';

  const handleRoleChange = async (userId, newRole) => {
    setLoadingId(userId);
    setError('');
    const res = await updateMemberRole(userId, newRole);
    setLoadingId(null);
    if (!res.success) {
      setError(res.error || 'Failed to update member role');
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) {
      return;
    }
    setLoadingId(userId);
    setError('');
    const res = await removeMember(userId);
    setLoadingId(null);
    if (!res.success) {
      setError(res.error || 'Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <Users className="w-4 h-4" />
            </div>
            <span>Workspace Members ({currentWorkspace.members?.length || 0})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Members List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {currentWorkspace.members?.map((memberEntry) => {
            const memberUser = memberEntry.user;
            if (!memberUser) return null;

            const isCurrent = memberUser._id === currentUser?._id;
            const memberRole = memberEntry.role;

            return (
              <div
                key={memberUser._id}
                className="p-3 rounded-xl bg-gray-950/80 border border-gray-800/80 flex items-center justify-between gap-3 hover:border-gray-700 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={memberUser.avatar}
                    name={memberUser.name}
                    size="md"
                    status={memberUser.status}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {memberUser.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
                          you
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {memberUser.email}
                    </div>
                    {memberUser.customStatus && (
                      <div className="text-[11px] text-gray-500 italic truncate mt-0.5">
                        "{memberUser.customStatus}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Role and actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Role badge / dropdown */}
                  {isOwner && !isCurrent ? (
                    <select
                      value={memberRole}
                      disabled={loadingId === memberUser._id}
                      onChange={(e) => handleRoleChange(memberUser._id, e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-700 text-xs font-semibold text-gray-200 outline-none focus:border-brand-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  ) : (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border ${
                        memberRole === 'owner'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : memberRole === 'admin'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          : 'bg-gray-800/80 text-gray-400 border-gray-700'
                      }`}
                    >
                      {memberRole === 'owner' ? (
                        <Crown className="w-3 h-3 text-amber-400" />
                      ) : memberRole === 'admin' ? (
                        <Shield className="w-3 h-3 text-indigo-400" />
                      ) : (
                        <User className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="capitalize">{memberRole}</span>
                    </span>
                  )}

                  {/* Remove button */}
                  {(isOwner || userRole === 'admin') && !isCurrent && memberRole !== 'owner' && (
                    <button
                      onClick={() => handleRemove(memberUser._id)}
                      disabled={loadingId === memberUser._id}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-800 bg-gray-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageMembersModal;
