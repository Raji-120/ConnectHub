import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import StatusIndicator from '../common/StatusIndicator';
import {
  Users,
  Pin,
  FileText,
  ChevronRight,
  Crown,
  Shield,
  Download,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

export const RightSidebar = ({
  isOpen = true,
  onToggle,
  pinnedMessages = [],
  sharedFiles = [],
  onStartDirectMessage,
}) => {
  const { currentWorkspace } = useWorkspace();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'files' | 'pins'

  if (!isOpen) return null;

  const members = currentWorkspace?.members || [];
  const onlineMembers = members.filter((m) => m.user?.status === 'online');
  const offlineMembers = members.filter((m) => m.user?.status !== 'online');

  return (
    <aside className="w-72 h-full bg-gray-900/90 border-l border-gray-800 flex flex-col shrink-0 select-none">
      {/* Header Tabs */}
      <div className="h-14 px-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-gray-950/70 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'members'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'files'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Files</span>
          </button>

          <button
            onClick={() => setActiveTab('pins')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'pins'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Pins</span>
          </button>
        </div>

        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            title="Collapse Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content based on Active Tab */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <>
            {/* Online Members */}
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <StatusIndicator status="online" size="sm" />
                <span>Online — {onlineMembers.length}</span>
              </div>
              <div className="space-y-1">
                {onlineMembers.map((m) => {
                  const u = m.user;
                  if (!u) return null;
                  const isCurrent = u._id === currentUser?._id;

                  return (
                    <div
                      key={u._id}
                      onClick={() => !isCurrent && onStartDirectMessage && onStartDirectMessage(u)}
                      className={`p-2 rounded-xl flex items-center justify-between group transition ${
                        !isCurrent ? 'hover:bg-gray-800/80 cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={u.avatar} name={u.name} size="sm" status={u.status} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-gray-200 truncate flex items-center gap-1">
                            <span>{u.name}</span>
                            {m.role === 'owner' && <Crown className="w-3 h-3 text-amber-400" />}
                            {m.role === 'admin' && <Shield className="w-3 h-3 text-indigo-400" />}
                          </div>
                          {u.customStatus && (
                            <div className="text-[10px] text-gray-400 truncate">
                              {u.customStatus}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-brand-400 transition"
                          title="Message directly"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Offline Members */}
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <StatusIndicator status="offline" size="sm" />
                <span>Offline — {offlineMembers.length}</span>
              </div>
              <div className="space-y-1 opacity-70 hover:opacity-100 transition-opacity">
                {offlineMembers.map((m) => {
                  const u = m.user;
                  if (!u) return null;
                  const isCurrent = u._id === currentUser?._id;

                  return (
                    <div
                      key={u._id}
                      onClick={() => !isCurrent && onStartDirectMessage && onStartDirectMessage(u)}
                      className={`p-2 rounded-xl flex items-center justify-between group transition ${
                        !isCurrent ? 'hover:bg-gray-800/80 cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={u.avatar} name={u.name} size="sm" status={u.status} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-gray-300 truncate flex items-center gap-1">
                            <span>{u.name}</span>
                            {m.role === 'owner' && <Crown className="w-3 h-3 text-amber-400" />}
                            {m.role === 'admin' && <Shield className="w-3 h-3 text-indigo-400" />}
                          </div>
                          {u.customStatus && (
                            <div className="text-[10px] text-gray-500 truncate">
                              {u.customStatus}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* SHARED FILES TAB */}
        {activeTab === 'files' && (
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Shared in Conversation
            </div>
            {sharedFiles.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500 bg-gray-950/40 rounded-xl border border-gray-800/60 p-4">
                <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                <span>No files shared yet in this channel or conversation.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {sharedFiles.map((file, i) => (
                  <a
                    key={i}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-gray-950/80 border border-gray-800 hover:border-brand-500/50 flex items-center justify-between group transition block"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {file.name || 'Shared File'}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {file.uploadedBy?.name || 'User'} •{' '}
                          {file.size ? `${Math.round(file.size / 1024)} KB` : 'File'}
                        </div>
                      </div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-gray-500 group-hover:text-brand-400 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PINNED MESSAGES TAB */}
        {activeTab === 'pins' && (
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Pinned Messages
            </div>
            {pinnedMessages.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500 bg-gray-950/40 rounded-xl border border-gray-800/60 p-4">
                <Pin className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                <span>No pinned messages yet. Important messages can be pinned here.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pinnedMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className="p-3 rounded-xl bg-gray-950/80 border border-gray-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span className="font-semibold text-brand-300">
                        {msg.sender?.name || 'User'}
                      </span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-gray-200 leading-relaxed">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;
