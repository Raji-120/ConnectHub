import express from 'express';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getUserNotifications);
router.put('/mark-all-read', markAllNotificationsRead);
router.put('/:notificationId/read', markNotificationRead);

export default router;
