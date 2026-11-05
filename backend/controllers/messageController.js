import Message from '../models/Message.js';
import Channel from '../models/Channel.js';
import Conversation from '../models/Conversation.js';

// @desc    Send a message (Channel or DM)
// @route   POST /api/workspaces/:workspaceId/messages
// @access  Private (Member)
export const sendMessage = async (req, res, next) => {
  try {
    const {
      content,
      channelId,
      conversationId,
      fileUrl,
      fileName,
      fileType,
      fileSize,
    } = req.body;
    const workspaceId = req.params.workspaceId;
    const currentUserId = req.user._id;

    if (!content && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message must contain text content or a file attachment',
      });
    }

    if (!channelId && !conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Either channelId or conversationId must be provided',
      });
    }

    // Verify channel access if sending to a channel
    if (channelId) {
      const channel = await Channel.findOne({
        _id: channelId,
        workspace: workspaceId,
      });

      if (!channel) {
        return res.status(404).json({
          success: false,
          message: 'Channel not found in this workspace',
        });
      }

      if (channel.isPrivate && !channel.members.includes(currentUserId)) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this private channel',
        });
      }
    }

    // Verify conversation access if sending a DM
    if (conversationId) {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        workspace: workspaceId,
        participants: currentUserId,
      });

      if (!conversation) {
        return res.status(403).json({
          success: false,
          message: 'You are not a participant in this conversation',
        });
      }
    }

    // Create message in MongoDB
    const message = await Message.create({
      sender: currentUserId,
      workspace: workspaceId,
      channel: channelId || null,
      conversation: conversationId || null,
      content: content ? content.trim() : '',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileType: fileType || '',
      fileSize: fileSize || 0,
      readBy: [{ user: currentUserId, readAt: new Date() }],
    });

    // If DM, update conversation's lastMessage reference
    if (conversationId) {
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: new Date(),
      });
    }

    const populated = await Message.findById(message._id)
      .populate('sender', 'name email avatar status customStatus')
      .populate('pinnedBy', 'name email avatar');

    res.status(201).json({
      success: true,
      message: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get channel messages
// @route   GET /api/workspaces/:workspaceId/channels/:channelId/messages
// @access  Private (Member)
export const getChannelMessages = async (req, res, next) => {
  try {
    const { workspaceId, channelId } = req.params;
    const currentUserId = req.user._id;

    const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    if (channel.isPrivate && !channel.members.includes(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages in this private channel',
      });
    }

    const messages = await Message.find({ channel: channelId })
      .populate('sender', 'name email avatar status customStatus')
      .populate('pinnedBy', 'name email avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark messages as read by current user
    await Message.updateMany(
      {
        channel: channelId,
        'readBy.user': { $ne: currentUserId },
      },
      {
        $addToSet: { readBy: { user: currentUserId, readAt: new Date() } },
      }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get conversation messages
// @route   GET /api/workspaces/:workspaceId/conversations/:conversationId/messages
// @access  Private
export const getConversationMessages = async (req, res, next) => {
  try {
    const { workspaceId, conversationId } = req.params;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      workspace: workspaceId,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages in this conversation',
      });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email avatar status customStatus')
      .populate('pinnedBy', 'name email avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark unread messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        'readBy.user': { $ne: currentUserId },
      },
      {
        $addToSet: { readBy: { user: currentUserId, readAt: new Date() } },
      }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    React to a message with an emoji
// @route   POST /api/workspaces/:workspaceId/messages/:messageId/react
// @access  Private
export const reactToMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const currentUserId = req.user._id;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required',
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    const existingIdx = message.reactions.findIndex(
      (r) => r.user.toString() === currentUserId.toString() && r.emoji === emoji
    );

    if (existingIdx > -1) {
      // Toggle off: remove reaction
      message.reactions.splice(existingIdx, 1);
    } else {
      // Toggle on: add reaction
      message.reactions.push({ user: currentUserId, emoji });
    }

    await message.save();

    const populated = await Message.findById(messageId)
      .populate('sender', 'name email avatar status customStatus')
      .populate('pinnedBy', 'name email avatar');

    res.status(200).json({
      success: true,
      message: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle pin status on message
// @route   POST /api/workspaces/:workspaceId/messages/:messageId/pin
// @access  Private
export const togglePinMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    message.isPinned = !message.isPinned;
    message.pinnedBy = message.isPinned ? currentUserId : null;
    message.pinnedAt = message.isPinned ? new Date() : null;

    await message.save();

    const populated = await Message.findById(messageId)
      .populate('sender', 'name email avatar status customStatus')
      .populate('pinnedBy', 'name email avatar');

    res.status(200).json({
      success: true,
      message: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pinned messages in a workspace or channel
// @route   GET /api/workspaces/:workspaceId/messages/pinned
// @access  Private
export const getPinnedMessages = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { channelId } = req.query;

    const filter = { workspace: workspaceId, isPinned: true };
    if (channelId) {
      filter.channel = channelId;
    }

    const pinnedMessages = await Message.find(filter)
      .populate('sender', 'name email avatar')
      .populate('pinnedBy', 'name email avatar')
      .sort({ pinnedAt: -1 });

    res.status(200).json({
      success: true,
      count: pinnedMessages.length,
      pinnedMessages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get shared files in a workspace or channel
// @route   GET /api/workspaces/:workspaceId/messages/files
// @access  Private
export const getSharedFiles = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { channelId } = req.query;

    const filter = { workspace: workspaceId, fileUrl: { $ne: '' } };
    if (channelId) {
      filter.channel = channelId;
    }

    const files = await Message.find(filter)
      .populate('sender', 'name email avatar')
      .select('fileName fileUrl fileType fileSize createdAt sender')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      files: files.map((f) => ({
        _id: f._id,
        name: f.fileName,
        url: f.fileUrl,
        type: f.fileType,
        size: f.fileSize,
        createdAt: f.createdAt,
        uploadedBy: f.sender,
      })),
    });
  } catch (error) {
    next(error);
  }
};
