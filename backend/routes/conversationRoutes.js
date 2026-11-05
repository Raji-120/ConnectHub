import express from 'express';
import {
  getOrCreateDirectConversation,
  getUserConversations,
  createGroupConversation,
} from '../controllers/conversationController.js';
import { getConversationMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkWorkspaceMember } from '../middleware/roleMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(checkWorkspaceMember);

router.post('/direct', getOrCreateDirectConversation);
router.post('/group', createGroupConversation);
router.get('/', getUserConversations);
router.get('/:conversationId/messages', getConversationMessages);

export default router;
