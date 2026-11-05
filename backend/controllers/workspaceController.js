import Workspace from '../models/Workspace.js';
import Channel from '../models/Channel.js';
import User from '../models/User.js';

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description, avatar } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Workspace name is required',
      });
    }

    const workspaceData = {
      name: name.trim(),
      description: description || '',
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
    };

    if (avatar) {
      workspaceData.avatar = avatar;
    }

    const workspace = await Workspace.create(workspaceData);

    // Automatically create default channels: general & random
    const defaultChannels = await Channel.insertMany([
      {
        name: 'general',
        description: 'Company-wide announcements and work-based matters',
        topic: 'Welcome to your workspace!',
        workspace: workspace._id,
        isPrivate: false,
        createdBy: req.user._id,
        members: [req.user._id],
      },
      {
        name: 'random',
        description: 'Non-work banter and water cooler chat',
        topic: 'Hangouts and coffee chats',
        workspace: workspace._id,
        isPrivate: false,
        createdBy: req.user._id,
        members: [req.user._id],
      },
    ]);

    const populatedWorkspace = await Workspace.findById(workspace._id).populate(
      'members.user',
      'name email avatar status customStatus'
    );

    res.status(201).json({
      success: true,
      workspace: populatedWorkspace,
      channels: defaultChannels,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workspaces user is a member of
// @route   GET /api/workspaces
// @access  Private
export const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id,
    })
      .populate('members.user', 'name email avatar status customStatus')
      .populate('owner', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: workspaces.length,
      workspaces,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single workspace details
// @route   GET /api/workspaces/:workspaceId
// @access  Private (Member)
export const getWorkspaceById = async (req, res, next) => {
  try {
    // req.workspace is already populated and checked by checkWorkspaceMember middleware
    res.status(200).json({
      success: true,
      workspace: req.workspace,
      userRole: req.userRole,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update workspace
// @route   PUT /api/workspaces/:workspaceId
// @access  Private (Owner/Admin)
export const updateWorkspace = async (req, res, next) => {
  try {
    const { name, description, avatar } = req.body;
    const workspace = req.workspace;

    if (name) workspace.name = name.trim();
    if (description !== undefined) workspace.description = description;
    if (avatar) workspace.avatar = avatar;

    await workspace.save();

    res.status(200).json({
      success: true,
      workspace,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite/Add a registered user to workspace
// @route   POST /api/workspaces/:workspaceId/members
// @access  Private (Owner/Admin)
export const inviteMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user email to invite',
      });
    }

    const userToInvite = await User.findOne({ email: email.toLowerCase() });
    if (!userToInvite) {
      return res.status(404).json({
        success: false,
        message: `No user found with email: ${email}. Please ensure they are registered first.`,
      });
    }

    const workspace = req.workspace;

    // Check if user is already a member
    const alreadyMember = workspace.members.some(
      (m) => m.user._id.toString() === userToInvite._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this workspace',
      });
    }

    workspace.members.push({
      user: userToInvite._id,
      role: ['owner', 'admin', 'member'].includes(role) ? role : 'member',
      joinedAt: new Date(),
    });

    await workspace.save();

    // Also auto-add new member to all public channels in this workspace
    await Channel.updateMany(
      { workspace: workspace._id, isPrivate: false },
      { $addToSet: { members: userToInvite._id } }
    );

    const updatedWorkspace = await Workspace.findById(workspace._id).populate(
      'members.user',
      'name email avatar status customStatus'
    );

    res.status(200).json({
      success: true,
      message: `${userToInvite.name} has been added to the workspace`,
      workspace: updatedWorkspace,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a member role (owner, admin, member)
// @route   PUT /api/workspaces/:workspaceId/members/:userId/role
// @access  Private (Owner only)
export const updateMemberRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['owner', 'admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be owner, admin, or member.',
      });
    }

    const workspace = req.workspace;

    const member = workspace.members.find(
      (m) => m.user._id.toString() === userId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in workspace',
      });
    }

    // If downgrading an owner, ensure at least one other owner remains
    if (member.role === 'owner' && role !== 'owner') {
      const ownerCount = workspace.members.filter((m) => m.role === 'owner').length;
      if (ownerCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Workspace must have at least one owner',
        });
      }
    }

    member.role = role;
    await workspace.save();

    res.status(200).json({
      success: true,
      message: `Member role updated to ${role}`,
      workspace,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member or leave workspace
// @route   DELETE /api/workspaces/:workspaceId/members/:userId
// @access  Private (Owner/Admin or self)
export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const isSelf = req.user._id.toString() === userId;

    if (!isSelf && req.userRole !== 'owner' && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove this member',
      });
    }

    const workspace = req.workspace;

    // Check if removing the last owner
    const targetMember = workspace.members.find(
      (m) => m.user._id.toString() === userId
    );

    if (targetMember && targetMember.role === 'owner') {
      const ownerCount = workspace.members.filter((m) => m.role === 'owner').length;
      if (ownerCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot leave/remove workspace: you are the only owner. Transfer ownership first.',
        });
      }
    }

    workspace.members = workspace.members.filter(
      (m) => m.user._id.toString() !== userId
    );

    await workspace.save();

    // Also remove user from channel members
    await Channel.updateMany(
      { workspace: workspace._id },
      { $pull: { members: userId } }
    );

    res.status(200).json({
      success: true,
      message: isSelf ? 'You have left the workspace' : 'Member removed successfully',
      workspace,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join workspace by invite code
// @route   POST /api/workspaces/join/:inviteCode
// @access  Private
export const joinByInviteCode = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;

    const workspace = await Workspace.findOne({
      inviteCode: inviteCode.toUpperCase().trim(),
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code. Workspace not found.',
      });
    }

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this workspace',
        workspace,
      });
    }

    workspace.members.push({
      user: req.user._id,
      role: 'member',
      joinedAt: new Date(),
    });

    await workspace.save();

    // Add to public channels
    await Channel.updateMany(
      { workspace: workspace._id, isPrivate: false },
      { $addToSet: { members: req.user._id } }
    );

    const populated = await Workspace.findById(workspace._id).populate(
      'members.user',
      'name email avatar status customStatus'
    );

    res.status(200).json({
      success: true,
      message: `Joined ${workspace.name}!`,
      workspace: populated,
    });
  } catch (error) {
    next(error);
  }
};
