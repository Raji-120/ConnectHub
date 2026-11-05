import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});

  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to Socket server
    const s = io(window.location.origin, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      console.log('[Socket] Connected to ConnectHub Real-Time Server');
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setIsConnected(false);
    });

    s.on('connect_error', (err) => {
      console.warn('[Socket Error]:', err.message);
    });

    // Handle initial online users list
    s.on('users:online', (ids) => {
      setOnlineUserIds(new Set(ids));
    });

    // Handle presence updates
    s.on('user:presence', ({ userId, status }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (status === 'online') {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    // Handle typing events
    s.on('user:typing', ({ userId, userName }) => {
      if (userId === user?._id) return;
      setTypingUsers((prev) => (prev.includes(userName) ? prev : [...prev, userName]));
    });

    s.on('user:stop_typing', ({ userId, userName }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== userName));
    });

    // Alert for incoming message when conversation is not focused
    s.on('conversation:message_alert', ({ conversationId, message }) => {
      if (message.sender?._id !== user?._id) {
        setUnreadMap((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, user]);

  // Actions
  const joinChannel = useCallback((channelId) => {
    if (socketRef.current && channelId) {
      socketRef.current.emit('channel:join', { channelId });
      // Clear unread count for this channel
      setUnreadMap((prev) => ({ ...prev, [channelId]: 0 }));
    }
  }, []);

  const leaveChannel = useCallback((channelId) => {
    if (socketRef.current && channelId) {
      socketRef.current.emit('channel:leave', { channelId });
    }
  }, []);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('conversation:join', { conversationId });
      // Clear unread count
      setUnreadMap((prev) => ({ ...prev, [conversationId]: 0 }));
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('conversation:leave', { conversationId });
    }
  }, []);

  const emitTyping = useCallback(({ channelId, conversationId }) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing:start', { channelId, conversationId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', { channelId, conversationId });
    }, 2500);
  }, []);

  const reactToMessage = useCallback((messageId, emoji, target) => {
    if (!socketRef.current) return;
    socketRef.current.emit('message:react', {
      messageId,
      emoji,
      channelId: target.channelId,
      conversationId: target.conversationId,
    });
  }, []);

  const pinMessage = useCallback((messageId, target) => {
    if (!socketRef.current) return;
    socketRef.current.emit('message:pin', {
      messageId,
      channelId: target.channelId,
      conversationId: target.conversationId,
    });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserIds,
        typingUsers,
        unreadMap,
        joinChannel,
        leaveChannel,
        joinConversation,
        leaveConversation,
        emitTyping,
        reactToMessage,
        pinMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
