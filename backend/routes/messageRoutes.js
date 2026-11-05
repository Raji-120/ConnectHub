import express from 'express';
import {
  sendMessage,
  getChannelMessages,
  getConversationMessages,
  reactToMessage,
  togglePinMessage,
  getPinnedMessages,
  getSharedFiles,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkWorkspaceMember } from '../middleware/roleMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(checkWorkspaceMember);

router.post('/', sendMessage);
router.get('/pinned', getPinnedMessages);
router.get('/files', getSharedFiles);
router.post('/:messageId/react', reactToMessage);
router.post('/:messageId/pin', togglePinMessage);

export default router;
