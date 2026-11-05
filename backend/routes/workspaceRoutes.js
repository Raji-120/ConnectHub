import express from 'express';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  inviteMember,
  updateMemberRole,
  removeMember,
  joinByInviteCode,
} from '../controllers/workspaceController.js';
import {
  createChannel,
  getChannels,
  getChannelById,
  updateChannel,
  deleteChannel,
  joinChannel,
  leaveChannel,
} from '../controllers/channelController.js';
import { getChannelMessages } from '../controllers/messageController.js';
import messageRoutes from './messageRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import taskRoutes from './taskRoutes.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkWorkspaceMember, requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All workspace routes require authentication
router.use(protect);

// Nested Message, Conversation, and Task sub-routers
router.use('/:workspaceId/messages', messageRoutes);
router.use('/:workspaceId/conversations', conversationRoutes);
router.use('/:workspaceId/tasks', taskRoutes);

// Workspace base routes
router.route('/').post(createWorkspace).get(getWorkspaces);
router.post('/join/:inviteCode', joinByInviteCode);

router
  .route('/:workspaceId')
  .get(checkWorkspaceMember, getWorkspaceById)
  .put(checkWorkspaceMember, requireRole(['owner', 'admin']), updateWorkspace);

// Workspace members management
router.post(
  '/:workspaceId/members',
  checkWorkspaceMember,
  requireRole(['owner', 'admin']),
  inviteMember
);

router.put(
  '/:workspaceId/members/:userId/role',
  checkWorkspaceMember,
  requireRole(['owner']),
  updateMemberRole
);

router.delete(
  '/:workspaceId/members/:userId',
  checkWorkspaceMember,
  removeMember
);

// Channel routes nested under workspace
router
  .route('/:workspaceId/channels')
  .post(checkWorkspaceMember, createChannel)
  .get(checkWorkspaceMember, getChannels);

router
  .route('/:workspaceId/channels/:channelId')
  .get(checkWorkspaceMember, getChannelById)
  .put(checkWorkspaceMember, updateChannel)
  .delete(checkWorkspaceMember, deleteChannel);

router.get(
  '/:workspaceId/channels/:channelId/messages',
  checkWorkspaceMember,
  getChannelMessages
);

router.post(
  '/:workspaceId/channels/:channelId/join',
  checkWorkspaceMember,
  joinChannel
);

router.post(
  '/:workspaceId/channels/:channelId/leave',
  checkWorkspaceMember,
  leaveChannel
);

export default router;
