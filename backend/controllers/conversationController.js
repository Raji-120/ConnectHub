import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

// @desc    Get or create a 1-on-1 direct conversation
// @route   POST /api/workspaces/:workspaceId/conversations/direct
// @access  Private (Workspace Member)
export const getOrCreateDirectConversation = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const workspaceId = req.params.workspaceId;
    const currentUserId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID is required',
      });
    }

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation with yourself',
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      workspace: workspaceId,
      isGroup: false,
      participants: { $all: [currentUserId, targetUserId], $size: 2 },
    })
      .populate('participants', 'name email avatar status customStatus')
      .populate('lastMessage');

    if (!conversation) {
      // Create new direct conversation
      conversation = await Conversation.create({
        workspace: workspaceId,
        participants: [currentUserId, targetUserId],
        isGroup: false,
      });

      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'name email avatar status customStatus'
      );
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for user in a workspace
// @route   GET /api/workspaces/:workspaceId/conversations
// @access  Private
export const getUserConversations = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId;
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      workspace: workspaceId,
      participants: currentUserId,
    })
      .populate('participants', 'name email avatar status customStatus')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name email avatar' },
      })
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a group conversation
// @route   POST /api/workspaces/:workspaceId/conversations/group
// @access  Private
export const createGroupConversation = async (req, res, next) => {
  try {
    const { participantIds, groupName, groupAvatar } = req.body;
    const workspaceId = req.params.workspaceId;
    const currentUserId = req.user._id;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Group conversation requires at least 2 other participants',
      });
    }

    const allParticipants = Array.from(new Set([currentUserId.toString(), ...participantIds]));

    const conversation = await Conversation.create({
      workspace: workspaceId,
      participants: allParticipants,
      isGroup: true,
      groupName: groupName || 'Group Chat',
      groupAvatar: groupAvatar || '',
    });

    const populated = await Conversation.findById(conversation._id).populate(
      'participants',
      'name email avatar status customStatus'
    );

    res.status(201).json({
      success: true,
      conversation: populated,
    });
  } catch (error) {
    next(error);
  }
};
