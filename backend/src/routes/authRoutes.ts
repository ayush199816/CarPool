import { Router } from 'express';
import { register, login, getProfile, createAdmin } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/create-admin', createAdmin); // One-time admin creation

// Protected routes
router.get('/profile', protect, getProfile);

export default router;
