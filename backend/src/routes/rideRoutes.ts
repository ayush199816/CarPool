import { Router, Request, Response, NextFunction } from 'express';
import { 
  getRides, 
  getRideById, 
  createRide, 
  updateRide, 
  deleteRide,
  debugListRides
} from '../controllers/rideController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Log all requests to ride routes
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[ROUTE] ${req.method} ${req.originalUrl}`);
  console.log('[ROUTE] Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Public routes
router.get('/', getRides);
router.get('/:id', getRideById);
router.get('/debug/all-rides', debugListRides); // Debug endpoint

// Protected routes (require authentication)
router.post('/', protect, (req, res) => {
  console.log('[ROUTE] POST /rides - After protect middleware');
  createRide(req, res);
});

router.put('/:id', protect, updateRide);
router.delete('/:id', protect, deleteRide);

export default router;
