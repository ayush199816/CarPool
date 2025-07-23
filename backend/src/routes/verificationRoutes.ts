import express from 'express';
import { uploadFile, getFile } from '../controllers/verificationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Upload file endpoint
router.post('/upload', protect, (req, res) => uploadFile(req, res));

// Serve uploaded files
router.get('/uploads/*', getFile);

export default router;
