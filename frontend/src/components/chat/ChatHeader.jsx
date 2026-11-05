import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import Avatar from '../common/Avatar';
import {
  Hash,
  Lock,
  Users,
  PanelRightOpen,
  PanelRightClose,
  Pin,
  FileText,
  Info,
} from 'lucide-react';

export const ChatHeader = ({
  rightSidebarOpen,
  onToggleRightSidebar,
  onlineCount,
}) => {
  const { currentChannel, activeConversation, currentWorkspace } = useWorkspace();

  const isDM = !!activeConversation;
  const targetUser = activeConversation?.targetUser;

  return (
    <header className="h-14 px-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0 select-none z-10">
      <div className="flex items-center gap-3 min-w-0">
        {isDM && targetUser ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={targetUser.avatar}
              name={targetUser.name}
              size="sm"
              status={targetUser.status}
            />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                <span>{targetUser.name}</span>
              </h2>
              <div className="text-[11px] text-gray-400 truncate">
                {targetUser.customStatus || targetUser.email}
              </div>
            </div>
          </div>
        ) : currentChannel ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="text-gray-400">
              {currentChannel.isPrivate ? (
                <Lock className="w-5 h-5 text-gray-400" />
              ) : (
                <Hash className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white truncate">
                  {currentChannel.name}
                </h2>
                {currentChannel.isPrivate && (
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-gray-800 text-gray-400">
                    Private
                  </span>
                )}
              </div>
              {currentChannel.topic && (
                <p className="text-[11px] text-gray-400 truncate max-w-md hidden sm:block">
                  {currentChannel.topic}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm font-semibold text-gray-400">
            Select a channel or conversation
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleRightSidebar}
          className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
            rightSidebarOpen
              ? 'bg-brand-600/20 text-brand-400 border-brand-500/40'
              : 'bg-gray-800/80 text-gray-400 hover:text-white border-gray-700'
          }`}
          title="Toggle Details & Members Panel"
        >
          {rightSidebarOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
          <span className="hidden md:inline">
            {currentChannel?.members?.length || currentWorkspace?.members?.length || 0} Members
          </span>
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
