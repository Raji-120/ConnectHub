import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { Hash, Lock, MessageSquare, Sparkles } from 'lucide-react';
import Avatar from '../common/Avatar';

export const MessageList = ({
  messages = [],
  currentUserId,
  currentChannel,
  activeConversation,
  typingUsers = [],
  onReact,
  onPin,
}) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const isDM = !!activeConversation;
  const targetUser = activeConversation?.targetUser;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
      {/* Channel / Conversation Welcome Banner */}
      <div className="mb-6 pt-6 pb-4 border-b border-gray-800/80">
        {isDM && targetUser ? (
          <div>
            <Avatar
              src={targetUser.avatar}
              name={targetUser.name}
              size="2xl"
              status={targetUser.status}
              className="mb-3"
            />
            <h3 className="text-xl font-bold text-white">{targetUser.name}</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md">
              This is the start of your direct message history with{' '}
              <strong className="text-gray-200">{targetUser.name}</strong> ({targetUser.email}). Messages sent here are completely private.
            </p>
          </div>
        ) : currentChannel ? (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 mb-3">
              {currentChannel.isPrivate ? (
                <Lock className="w-6 h-6 text-brand-400" />
              ) : (
                <Hash className="w-6 h-6 text-brand-400" />
              )}
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Welcome to #{currentChannel.name}!
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-lg">
              {currentChannel.description ||
                `This is the start of the #${currentChannel.name} channel.`}
            </p>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            Select a channel from the left sidebar
          </div>
        )}
      </div>

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="text-center py-12 text-xs text-gray-500">
          No messages yet. Send a message below to start the conversation!
        </div>
      ) : (
        messages.map((msg) => (
          <MessageItem
            key={msg._id}
            message={msg}
            currentUserId={currentUserId}
            onReact={onReact}
            onPin={onPin}
            isPinned={msg.isPinned}
          />
        ))
      )}

      {/* Typing indicator row */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-gray-400 italic flex items-center gap-2 animate-pulse">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" />
            <span
              className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
              style={{ animationDelay: '0.15s' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
              style={{ animationDelay: '0.3s' }}
            />
          </div>
          <span>
            {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
