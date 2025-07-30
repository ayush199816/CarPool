import express from 'express';
import { 
  uploadFile, 
  getFile, 
  getPendingVerifications, 
  updateVerificationStatus 
} from '../controllers/verificationController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Parse JSON and URL-encoded bodies before our custom middleware
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Upload file endpoint
router.post('/upload', protect, uploadFile);

// Serve uploaded files
router.get('/uploads/*', getFile);

// Get pending verifications (admin only)
router.get('/pending', protect, admin, getPendingVerifications);

// Update verification status (admin only)
router.patch(
  '/:id/status', 
  protect, 
  admin, 
  express.json(),
  updateVerificationStatus
);

export default router;
