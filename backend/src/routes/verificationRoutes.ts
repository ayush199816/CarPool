import express from 'express';
import { uploadFile, getFile } from '../controllers/verificationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Parse JSON and URL-encoded bodies before our custom middleware
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Upload file endpoint
router.post('/upload', protect, uploadFile);

// Serve uploaded files
router.get('/uploads/*', getFile);

export default router;
