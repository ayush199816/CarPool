import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  addVehicle,
  getVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  addVehicleDocuments,
} from '../controllers/vehicleController';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Route:   POST /api/vehicles
// Desc:    Add a new vehicle
// Access:  Private
router.post('/', (req, res, next) => addVehicle(req as any, res).catch(next));

// Route:   GET /api/vehicles
// Desc:    Get all vehicles for the authenticated user
// Access:  Private
router.get('/', (req, res, next) => getVehicles(req as any, res).catch(next));

// Route:   GET /api/vehicles/:id
// Desc:    Get a single vehicle by ID
// Access:  Private
router.get('/:id', (req, res, next) => getVehicle(req as any, res).catch(next));

// Route:   PUT /api/vehicles/:id
// Desc:    Update a vehicle
// Access:  Private
router.put('/:id', (req, res, next) => updateVehicle(req as any, res).catch(next));

// Route:   DELETE /api/vehicles/:id
// Desc:    Delete a vehicle (soft delete)
// Access:  Private
router.delete('/:id', (req, res, next) => deleteVehicle(req as any, res).catch(next));

// Route:   POST /api/vehicles/:id/documents
// Desc:    Add verification documents to a vehicle
// Access:  Private
router.post('/:id/documents', (req, res, next) => addVehicleDocuments(req as any, res).catch(next));

export default router;
