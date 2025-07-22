import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  createBookingRequest,
  updateBookingStatus,
  getRideBookings,
  getUserBookings,
} from '../controllers/bookingController';

const router = express.Router();

// Protect all routes with authentication
router.use(protect);

// Create a new booking request for a specific ride
router.post('/rides/:rideId/bookings', createBookingRequest);

// Update booking request status (accept/reject) for a specific ride
router.patch('/rides/:rideId/bookings/:requestId', updateBookingStatus);

// Get all bookings for a specific ride (ride owner only)
router.get('/rides/:rideId/bookings', getRideBookings);

// Get all bookings for the current user
router.get('/bookings/my-bookings', getUserBookings);

export default router;
