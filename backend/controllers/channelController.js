import Channel from '../models/Channel.js';
import Workspace from '../models/Workspace.js';

// @desc    Create a new channel in a workspace
// @route   POST /api/workspaces/:workspaceId/channels
// @access  Private (Workspace Member)
export const createChannel = async (req, res, next) => {
  try {
    const { name, description, topic, isPrivate = false } = req.body;
    const workspaceId = req.params.workspaceId;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Channel name is required',
      });
    }

    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');

    // Check if channel already exists in this workspace
    const existing = await Channel.findOne({
      workspace: workspaceId,
      name: cleanName,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A channel named #${cleanName} already exists in this workspace`,
      });
    }

    // Default members: if public, all workspace members; if private, creator
    let channelMembers = [req.user._id];
    if (!isPrivate) {
      const workspace = req.workspace;
      channelMembers = workspace.members.map((m) => m.user._id || m.user);
    }

    const channel = await Channel.create({
      name: cleanName,
      description: description || '',
      topic: topic || '',
      workspace: workspaceId,
      isPrivate: Boolean(isPrivate),
      createdBy: req.user._id,
      members: channelMembers,
    });

    res.status(201).json({
      success: true,
      channel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all channels in a workspace for the user
// @route   GET /api/workspaces/:workspaceId/channels
// @access  Private (Workspace Member)
export const getChannels = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId;
    const userId = req.user._id;

    // Return public channels OR private channels where user is a member
    const channels = await Channel.find({
      workspace: workspaceId,
      $or: [
        { isPrivate: false },
        { isPrivate: true, members: userId },
      ],
    })
      .populate('createdBy', 'name email avatar')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: channels.length,
      channels,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get channel details
// @route   GET /api/workspaces/:workspaceId/channels/:channelId
// @access  Private (Member)
export const getChannelById = async (req, res, next) => {
  try {
    const { channelId, workspaceId } = req.params;

    const channel = await Channel.findOne({
      _id: channelId,
      workspace: workspaceId,
    })
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar status customStatus');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    // Check private channel membership
    if (channel.isPrivate) {
      const isMember = channel.members.some(
        (m) => m._id.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this private channel',
        });
      }
    }

    res.status(200).json({
      success: true,
      channel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a channel
// @route   POST /api/workspaces/:workspaceId/channels/:channelId/join
// @access  Private (Workspace Member)
export const joinChannel = async (req, res, next) => {
  try {
    const { channelId, workspaceId } = req.params;

    const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    if (channel.isPrivate && req.userRole !== 'owner' && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot join private channel without an invitation',
      });
    }

    if (!channel.members.includes(req.user._id)) {
      channel.members.push(req.user._id);
      await channel.save();
    }

    res.status(200).json({
      success: true,
      message: `Joined #${channel.name}`,
      channel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a channel
// @route   POST /api/workspaces/:workspaceId/channels/:channelId/leave
// @access  Private
export const leaveChannel = async (req, res, next) => {
  try {
    const { channelId, workspaceId } = req.params;

    const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    if (channel.name === 'general') {
      return res.status(400).json({
        success: false,
        message: 'Members cannot leave the default #general channel',
      });
    }

    channel.members = channel.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );
    await channel.save();

    res.status(200).json({
      success: true,
      message: `Left #${channel.name}`,
      channel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update channel details (topic/description)
// @route   PUT /api/workspaces/:workspaceId/channels/:channelId
// @access  Private (Owner/Admin or Creator)
export const updateChannel = async (req, res, next) => {
  try {
    const { channelId, workspaceId } = req.params;
    const { topic, description, name } = req.body;

    const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    const isCreator = channel.createdBy.toString() === req.user._id.toString();
    const isPrivileged = req.userRole === 'owner' || req.userRole === 'admin';

    if (!isCreator && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this channel',
      });
    }

    if (topic !== undefined) channel.topic = topic;
    if (description !== undefined) channel.description = description;
    if (name && channel.name !== 'general') {
      channel.name = name.trim().toLowerCase().replace(/\s+/g, '-');
    }

    await channel.save();

    res.status(200).json({
      success: true,
      channel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete channel
// @route   DELETE /api/workspaces/:workspaceId/channels/:channelId
// @access  Private (Owner/Admin or Creator)
export const deleteChannel = async (req, res, next) => {
  try {
    const { channelId, workspaceId } = req.params;

    const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    if (channel.name === 'general') {
      return res.status(400).json({
        success: false,
        message: 'The default #general channel cannot be deleted',
      });
    }

    const isCreator = channel.createdBy.toString() === req.user._id.toString();
    const isPrivileged = req.userRole === 'owner' || req.userRole === 'admin';

    if (!isCreator && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this channel',
      });
    }

    await Channel.findByIdAndDelete(channelId);

    res.status(200).json({
      success: true,
      message: `Channel #${channel.name} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
