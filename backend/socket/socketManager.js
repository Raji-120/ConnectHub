import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Channel from '../models/Channel.js';
import Conversation from '../models/Conversation.js';

// Map of userId -> Set of active socket IDs
const onlineUsers = new Map();

export const initSocket = (io) => {
  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Also check handshake cookies if available
      if (!token && socket.handshake.headers?.cookie) {
        const rawCookies = socket.handshake.headers.cookie.split(';');
        for (const cookie of rawCookies) {
          const [key, val] = cookie.trim().split('=');
          if (key === 'token') {
            token = val;
            break;
          }
        }
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'connecthub_secret_key_change_in_production'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: ' + err.message));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();

    // 1. Track Presence
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      // First active connection: broadcast online status to everyone
      io.emit('user:presence', {
        userId,
        status: 'online',
        lastActiveAt: new Date(),
      });
      // Update in MongoDB
      await User.findByIdAndUpdate(userId, { status: 'online', lastActiveAt: new Date() });
    }
    onlineUsers.get(userId).add(socket.id);

    // Join user's personal private room
    socket.join(`user:${userId}`);

    // Send the list of currently online user IDs to the connected client
    socket.emit('users:online', Array.from(onlineUsers.keys()));

    console.log(`[Socket] User connected: ${socket.user.name} (${socket.id}) - Total online: ${onlineUsers.size}`);

    // 2. Room Subscriptions
    socket.on('channel:join', ({ channelId }) => {
      if (channelId) {
        socket.join(`channel:${channelId}`);
      }
    });

    socket.on('channel:leave', ({ channelId }) => {
      if (channelId) {
        socket.leave(`channel:${channelId}`);
      }
    });

    socket.on('conversation:join', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on('conversation:leave', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // 3. Send Message Event (Persist in MongoDB and Broadcast)
    socket.on('message:send', async (data, callback) => {
      try {
        const {
          workspaceId,
          channelId,
          conversationId,
          content,
          fileUrl,
          fileName,
          fileType,
          fileSize,
        } = data;

        if (!content && !fileUrl) {
          if (callback) callback({ error: 'Message must have content or file' });
          return;
        }

        // Save to MongoDB
        const message = await Message.create({
          sender: socket.user._id,
          workspace: workspaceId,
          channel: channelId || null,
          conversation: conversationId || null,
          content: content ? content.trim() : '',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          fileType: fileType || '',
          fileSize: fileSize || 0,
          readBy: [{ user: socket.user._id, readAt: new Date() }],
        });

        // If conversation, update lastMessage
        if (conversationId) {
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            lastMessageAt: new Date(),
          });
        }

        const populated = await Message.findById(message._id)
          .populate('sender', 'name email avatar status customStatus')
          .populate('pinnedBy', 'name email avatar');

        // Broadcast to appropriate room
        if (channelId) {
          io.to(`channel:${channelId}`).emit('message:received', populated);
        } else if (conversationId) {
          io.to(`conversation:${conversationId}`).emit('message:received', populated);

          // Also notify conversation participants directly for unread badge counts
          const conv = await Conversation.findById(conversationId);
          if (conv) {
            conv.participants.forEach((pId) => {
              io.to(`user:${pId.toString()}`).emit('conversation:message_alert', {
                conversationId,
                message: populated,
              });
            });
          }
        }

        if (callback) callback({ success: true, message: populated });
      } catch (err) {
        console.error('[Socket Error] message:send:', err);
        if (callback) callback({ error: err.message });
      }
    });

    // 4. Typing Indicators
    socket.on('typing:start', ({ channelId, conversationId }) => {
      const payload = {
        userId: socket.user._id,
        userName: socket.user.name,
        channelId,
        conversationId,
      };

      if (channelId) {
        socket.to(`channel:${channelId}`).emit('user:typing', payload);
      } else if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('user:typing', payload);
      }
    });

    socket.on('typing:stop', ({ channelId, conversationId }) => {
      const payload = {
        userId: socket.user._id,
        channelId,
        conversationId,
      };

      if (channelId) {
        socket.to(`channel:${channelId}`).emit('user:stop_typing', payload);
      } else if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('user:stop_typing', payload);
      }
    });

    // 5. Reactions Event
    socket.on('message:react', async ({ messageId, emoji, channelId, conversationId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingIdx = message.reactions.findIndex(
          (r) => r.user.toString() === socket.user._id.toString() && r.emoji === emoji
        );

        if (existingIdx > -1) {
          message.reactions.splice(existingIdx, 1);
        } else {
          message.reactions.push({ user: socket.user._id, emoji });
        }

        await message.save();

        const populated = await Message.findById(messageId)
          .populate('sender', 'name email avatar status customStatus')
          .populate('pinnedBy', 'name email avatar');

        const room = channelId ? `channel:${channelId}` : `conversation:${conversationId}`;
        io.to(room).emit('message:updated', populated);
      } catch (err) {
        console.error('[Socket Error] message:react:', err);
      }
    });

    // 6. Pin Message Event
    socket.on('message:pin', async ({ messageId, channelId, conversationId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        message.isPinned = !message.isPinned;
        message.pinnedBy = message.isPinned ? socket.user._id : null;
        message.pinnedAt = message.isPinned ? new Date() : null;

        await message.save();

        const populated = await Message.findById(messageId)
          .populate('sender', 'name email avatar status customStatus')
          .populate('pinnedBy', 'name email avatar');

        const room = channelId ? `channel:${channelId}` : `conversation:${conversationId}`;
        io.to(room).emit('message:updated', populated);
      } catch (err) {
        console.error('[Socket Error] message:pin:', err);
      }
    });

    // 7. Read Receipt Event
    socket.on('message:read', async ({ messageId, channelId, conversationId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: { user: socket.user._id, readAt: new Date() } },
        });

        const room = channelId ? `channel:${channelId}` : `conversation:${conversationId}`;
        io.to(room).emit('message:read_receipt', {
          messageId,
          userId: socket.user._id,
          readAt: new Date(),
        });
      } catch (err) {
        console.error('[Socket Error] message:read:', err);
      }
    });

    // 8. Disconnect Handler
    socket.on('disconnect', async () => {
      if (onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast offline status
          io.emit('user:presence', {
            userId,
            status: 'offline',
            lastActiveAt: new Date(),
          });
          // Update in MongoDB
          await User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastActiveAt: new Date(),
          });
        }
      }
      console.log(`[Socket] User disconnected: ${socket.user.name} - Online users: ${onlineUsers.size}`);
    });
  });
};

export const getOnlineUsers = () => Array.from(onlineUsers.keys());
