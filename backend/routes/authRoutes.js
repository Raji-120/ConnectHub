import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  searchUsers,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, searchUsers);

export default router;
