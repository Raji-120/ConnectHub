import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../common/Avatar';
import StatusIndicator from '../common/StatusIndicator';
import {
  MessageSquare,
  Plus,
  Hash,
  Lock,
  ChevronDown,
  UserPlus,
  Users,
  Settings,
  LogOut,
  Sun,
  Moon,
  CheckSquare,
  Sparkles,
  Layers,
  Key,
} from 'lucide-react';

export const LeftSidebar = ({
  onOpenCreateWorkspace,
  onOpenCreateChannel,
  onOpenInviteMember,
  onOpenManageMembers,
  onOpenProfile,
  onOpenJoinWorkspace,
  onSelectTasksView,
  isTasksView,
  conversations = [],
  unreadMap = {},
}) => {
  const {
    workspaces,
    currentWorkspace,
    channels,
    currentChannel,
    activeConversation,
    userRole,
    selectWorkspace,
    selectChannel,
    selectConversation,
  } = useWorkspace();

  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  return (
    <aside className="h-screen flex shrink-0 select-none border-r border-gray-800 bg-gray-950">
      {/* ================= FAR LEFT WORKSPACE RAIL ================= */}
      <div className="w-[70px] h-full bg-gray-950 border-r border-gray-800/80 flex flex-col items-center py-3.5 gap-2.5 z-20">
        {/* ConnectHub Logo */}
        <div
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/30 ring-1 ring-white/20 mb-2 cursor-pointer hover:scale-105 transition-transform"
          title="ConnectHub Platform"
        >
          <MessageSquare className="w-6 h-6" />
        </div>

        <div className="w-8 h-[2px] bg-gray-800 rounded-full my-1" />

        {/* Workspaces List */}
        <div className="flex-1 w-full flex flex-col items-center gap-2.5 overflow-y-auto overflow-x-hidden py-1 px-2">
          {workspaces.map((ws) => {
            const isActive = currentWorkspace?._id === ws._id && !isTasksView;
            return (
              <div key={ws._id} className="relative group flex items-center justify-center w-full">
                {/* Active left indicator pill */}
                <div
                  className={`absolute left-0 w-1 rounded-r-full bg-white transition-all duration-200 ${
                    isActive ? 'h-9' : 'h-0 group-hover:h-4'
                  }`}
                />

                <button
                  onClick={() => {
                    selectWorkspace(ws);
                    if (isTasksView && onSelectTasksView) {
                      onSelectTasksView(false);
                    }
                  }}
                  className={`w-12 h-12 rounded-2xl transition-all duration-200 flex items-center justify-center font-bold text-sm overflow-hidden border ${
                    isActive
                      ? 'bg-brand-600 text-white rounded-2xl border-brand-400 shadow-lg shadow-brand-600/30'
                      : 'bg-gray-900 text-gray-300 hover:text-white hover:rounded-2xl rounded-3xl border-gray-800 hover:border-gray-700'
                  }`}
                  title={ws.name}
                >
                  {ws.avatar ? (
                    <img src={ws.avatar} alt={ws.name} className="w-full h-full object-cover" />
                  ) : (
                    ws.name.slice(0, 2).toUpperCase()
                  )}
                </button>
              </div>
            );
          })}

          {/* Add Workspace Button */}
          <div className="relative group flex items-center justify-center w-full mt-1">
            <button
              onClick={onOpenCreateWorkspace}
              className="w-12 h-12 rounded-3xl hover:rounded-2xl bg-gray-900/90 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-dashed border-gray-700 hover:border-transparent transition-all duration-200 flex items-center justify-center shadow-sm"
              title="Create Workspace"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Join by Code Button */}
          <div className="relative group flex items-center justify-center w-full">
            <button
              onClick={onOpenJoinWorkspace}
              className="w-10 h-10 rounded-2xl bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-brand-300 border border-gray-800 transition-all flex items-center justify-center"
              title="Join via Invite Code"
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Theme & Profile Bottom Icons */}
        <div className="w-full flex flex-col items-center gap-2 pt-2 border-t border-gray-800/80">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          <button
            onClick={onOpenProfile}
            className="relative group cursor-pointer"
            title="Edit Profile"
          >
            <Avatar src={user?.avatar} name={user?.name} size="sm" status={user?.status} />
          </button>
        </div>
      </div>

      {/* ================= MIDDLE CHANNELS & DMS COLUMN ================= */}
      <div className="w-64 h-full bg-gray-900/95 flex flex-col border-r border-gray-800/80">
        {/* Workspace Dropdown Header */}
        <div className="relative">
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="w-full h-14 px-4 border-b border-gray-800 flex items-center justify-between hover:bg-gray-800/50 transition text-left"
          >
            <div className="min-w-0 pr-2">
              <h2 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                {currentWorkspace?.name || 'No Workspace'}
              </h2>
              <span className="text-[11px] text-brand-400 font-medium capitalize flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {userRole} Role
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                workspaceMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Workspace Dropdown Menu */}
          {workspaceMenuOpen && (
            <div className="absolute top-16 left-3 right-3 z-30 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl py-1.5 animate-fadeIn">
              <button
                onClick={() => {
                  setWorkspaceMenuOpen(false);
                  onOpenInviteMember();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-brand-300 hover:bg-brand-500/10 flex items-center gap-2.5 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite People</span>
              </button>

              <button
                onClick={() => {
                  setWorkspaceMenuOpen(false);
                  onOpenManageMembers();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-gray-300 hover:bg-gray-800/80 flex items-center gap-2.5 transition"
              >
                <Users className="w-4 h-4 text-gray-400" />
                <span>Manage Members</span>
              </button>

              <button
                onClick={() => {
                  setWorkspaceMenuOpen(false);
                  onOpenCreateChannel();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-gray-300 hover:bg-gray-800/80 flex items-center gap-2.5 transition"
              >
                <Plus className="w-4 h-4 text-gray-400" />
                <span>Create Channel</span>
              </button>

              <div className="my-1 border-t border-gray-800" />

              <button
                onClick={() => {
                  setWorkspaceMenuOpen(false);
                  onOpenProfile();
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium text-gray-300 hover:bg-gray-800/80 flex items-center gap-2.5 transition"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span>Profile Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* Task Management Shortcut Tab */}
        <div className="p-3 border-b border-gray-800/60">
          <button
            onClick={() => onSelectTasksView && onSelectTasksView(!isTasksView)}
            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
              isTasksView
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-gray-950/60 hover:bg-gray-800 text-gray-300 border border-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <span>Workspace Tasks</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-800/80 text-gray-400">
              Kanban
            </span>
          </button>
        </div>

        {/* Channels & Direct Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
          {/* Channels Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Channels</span>
              <button
                onClick={onOpenCreateChannel}
                className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition"
                title="Create Channel"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {channels.map((channel) => {
                const isActive =
                  !isTasksView &&
                  !activeConversation &&
                  currentChannel?._id === channel._id;
                const unreadCount = unreadMap[channel._id] || 0;

                return (
                  <button
                    key={channel._id}
                    onClick={() => {
                      selectChannel(channel);
                      if (onSelectTasksView) onSelectTasksView(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between group transition ${
                      isActive
                        ? 'bg-brand-600/20 text-white border border-brand-500/40'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {channel.isPrivate ? (
                        <Lock className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 shrink-0" />
                      ) : (
                        <Hash className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 shrink-0" />
                      )}
                      <span className="truncate">{channel.name}</span>
                    </div>

                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-brand-500 text-white font-bold text-[10px] shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Direct Messages</span>
            </div>

            <div className="space-y-0.5">
              {/* Display members in workspace as quick direct message targets */}
              {currentWorkspace?.members
                ?.filter((m) => (m.user?._id || m.user) !== user?._id)
                .map((m) => {
                  const memberUser = m.user;
                  if (!memberUser) return null;

                  const isActive =
                    !isTasksView &&
                    activeConversation?.participants?.some(
                      (p) => (p._id || p) === memberUser._id
                    );
                  const unreadCount = unreadMap[memberUser._id] || 0;

                  return (
                    <button
                      key={memberUser._id}
                      onClick={() => {
                        // Will trigger or select conversation in Phase 3
                        selectConversation({
                          isDirect: true,
                          targetUser: memberUser,
                          participants: [user, memberUser],
                        });
                        if (onSelectTasksView) onSelectTasksView(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between group transition ${
                        isActive
                          ? 'bg-brand-600/20 text-white border border-brand-500/40'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={memberUser.avatar}
                          name={memberUser.name}
                          size="xs"
                          status={memberUser.status}
                        />
                        <span className="truncate">{memberUser.name}</span>
                      </div>

                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-brand-500 text-white font-bold text-[10px] shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* User Status Bar at Bottom */}
        <div className="h-14 px-3 bg-gray-950/90 border-t border-gray-800 flex items-center justify-between">
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition"
          >
            <Avatar src={user?.avatar} name={user?.name} size="sm" status={user?.status} />
            <div className="min-w-0 text-left">
              <div className="text-xs font-semibold text-white truncate max-w-[110px]">
                {user?.name}
              </div>
              <div className="text-[10px] text-gray-400 truncate max-w-[110px]">
                {user?.customStatus || `@${user?.email?.split('@')[0]}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenProfile}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              title="Edit Profile"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;
