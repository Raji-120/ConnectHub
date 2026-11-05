import express from 'express';
import { handleFileUpload } from '../controllers/uploadController.js';
import { upload } from '../config/cloudinary.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('file'), handleFileUpload);

export default router;
