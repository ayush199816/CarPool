import { Router } from 'express';
import { 
  getUsers, 
  updateUser, 
  deleteUser, 
  getStats 
} from '../controllers/adminController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

// All routes are protected and require admin privileges
router.use(protect);
router.use(admin);

// User management routes
router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .patch(updateUser)
  .delete(deleteUser);

// Stats route
router.get('/stats', getStats);

export default router;
