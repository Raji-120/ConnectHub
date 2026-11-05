import express from 'express';
import {
  createTask,
  getWorkspaceTasks,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkWorkspaceMember } from '../middleware/roleMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(checkWorkspaceMember);

router.route('/').post(createTask).get(getWorkspaceTasks);
router.route('/:taskId').put(updateTask).delete(deleteTask);

export default router;
