import React, { useState } from 'react';
import Avatar from '../common/Avatar';
import {
  FileText,
  Download,
  Pin,
  Smile,
  Check,
  CheckCheck,
  Crown,
  Shield,
  ExternalLink,
} from 'lucide-react';

const QUICK_REACTIONS = ['👍', '❤️', '🔥', '🚀', '🎉', '😂'];

export const MessageItem = ({
  message,
  currentUserId,
  onReact,
  onPin,
  isPinned = false,
}) => {
  const [showActionBar, setShowActionBar] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const sender = message.sender || {};
  const isMine = sender._id === currentUserId;

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Today at ${timeStr}` : `${date.toLocaleDateString()} ${timeStr}`;
  };

  // Group reactions: emoji -> count and userIds
  const reactionMap = {};
  if (message.reactions && Array.isArray(message.reactions)) {
    message.reactions.forEach((r) => {
      if (!reactionMap[r.emoji]) {
        reactionMap[r.emoji] = { count: 0, users: [] };
      }
      reactionMap[r.emoji].count += 1;
      reactionMap[r.emoji].users.push(r.user);
    });
  }

  const handleToggleReaction = (emoji) => {
    if (onReact) {
      onReact(message._id, emoji);
    }
    setShowReactionPicker(false);
  };

  return (
    <div
      onMouseEnter={() => setShowActionBar(true)}
      onMouseLeave={() => {
        setShowActionBar(false);
        setShowReactionPicker(false);
      }}
      className={`relative px-4 py-2 hover:bg-gray-800/40 rounded-xl transition flex items-start gap-3 group ${
        isPinned ? 'bg-amber-500/5 border-l-2 border-amber-500/50' : ''
      }`}
    >
      {/* Floating Action Bar */}
      {showActionBar && (
        <div className="absolute right-4 -top-3.5 z-20 bg-gray-900 border border-gray-800 rounded-xl shadow-xl flex items-center p-1 gap-1 animate-fadeIn">
          {/* Reaction Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              title="Add Reaction"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {showReactionPicker && (
              <div className="absolute right-0 bottom-8 z-30 p-1.5 rounded-xl bg-gray-950 border border-gray-800 shadow-2xl flex items-center gap-1">
                {QUICK_REACTIONS.map((em) => (
                  <button
                    key={em}
                    onClick={() => handleToggleReaction(em)}
                    className="p-1 hover:scale-125 transition-transform text-sm"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pin Button */}
          <button
            onClick={() => onPin && onPin(message._id)}
            className={`p-1.5 rounded-lg transition ${
              isPinned
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={isPinned ? 'Unpin message' : 'Pin message'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sender Avatar */}
      <Avatar
        src={sender.avatar}
        name={sender.name}
        size="md"
        status={sender.status}
      />

      <div className="flex-1 min-w-0">
        {/* Header: Name, Role, Timestamp */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-white hover:underline cursor-pointer">
            {sender.name || 'Unknown User'}
          </span>

          <span className="text-[11px] text-gray-500">
            {formatTimestamp(message.createdAt)}
          </span>

          {isPinned && (
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Pin className="w-2.5 h-2.5" /> Pinned
            </span>
          )}

          {/* Read receipt tick */}
          {isMine && (
            <span
              className="text-gray-500"
              title={
                message.readBy && message.readBy.length > 1
                  ? 'Read'
                  : 'Delivered'
              }
            >
              {message.readBy && message.readBy.length > 1 ? (
                <CheckCheck className="w-3.5 h-3.5 text-brand-400 inline" />
              ) : (
                <Check className="w-3.5 h-3.5 inline" />
              )}
            </span>
          )}
        </div>

        {/* Message Content */}
        {message.content && (
          <p className="mt-1 text-sm text-gray-200 leading-relaxed break-words whitespace-pre-wrap select-text">
            {message.content}
          </p>
        )}

        {/* File Attachment Rendering */}
        {message.fileUrl && (
          <div className="mt-2.5 max-w-sm">
            {message.fileType && message.fileType.startsWith('image/') ? (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl border border-gray-800 max-h-72 group relative"
              >
                <img
                  src={message.fileUrl}
                  alt={message.fileName || 'Uploaded image'}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                />
                <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </a>
            ) : (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="p-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-brand-500/50 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate max-w-[200px]">
                      {message.fileName || 'Download attachment'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {message.fileSize
                        ? `${Math.round(message.fileSize / 1024)} KB`
                        : 'File attachment'}
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-gray-400 group-hover:text-brand-400 transition" />
              </a>
            )}
          </div>
        )}

        {/* Reactions List */}
        {Object.keys(reactionMap).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 items-center">
            {Object.entries(reactionMap).map(([emoji, data]) => {
              const hasReacted = data.users.some(
                (u) => (u._id || u) === currentUserId
              );
              return (
                <button
                  key={emoji}
                  onClick={() => handleToggleReaction(emoji)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                    hasReacted
                      ? 'bg-brand-500/20 text-brand-300 border-brand-500/50'
                      : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-[11px]">{data.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
