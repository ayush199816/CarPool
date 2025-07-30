import { Request, Response } from 'express';
import Ride, { IRide } from '../models/Ride';
import { AuthenticatedUser } from '../types/express';

// @desc    Get all rides with optional filters
// @route   GET /api/rides
// @access  Public
export const getRides = async (req: Request, res: Response) => {
  try {
    const { from, to, date, seats } = req.query;
    
    // Build query
    const query: any = {
      travelDate: { $gte: new Date() } // Always show future rides by default
    };
    
    // Handle from (start point) search (case-insensitive partial match)
    if (from && typeof from === 'string' && from.trim() !== '') {
      query.startPoint = { $regex: from.trim(), $options: 'i' };
    }
    
    // Handle to (end point) search (case-insensitive partial match)
    if (to && typeof to === 'string' && to.trim() !== '') {
      query.endPoint = { $regex: to.trim(), $options: 'i' };
    }
    
    // Handle date filter (exact date match)
    if (date && typeof date === 'string') {
      try {
        const searchDate = new Date(date);
        if (!isNaN(searchDate.getTime())) {
          const startOfDay = new Date(searchDate);
          startOfDay.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(searchDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          query.travelDate = {
            $gte: startOfDay,
            $lte: endOfDay
          };
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
    
    // Handle seats filter (minimum available seats)
    if (seats && (typeof seats === 'string' || typeof seats === 'number')) {
      const seatsNum = parseInt(seats.toString(), 10);
      if (!isNaN(seatsNum) && seatsNum > 0) {
        query.availableSeats = { $gte: seatsNum };
      }
    }
    
    console.log('Querying rides with filters:', JSON.stringify(query, null, 2));
    
    let rides = await Ride.find(query)
      .populate('driverId', 'name email phone')
      .sort({ travelDate: 1, pricePerSeat: 1 })
      .lean();
      
    // Map driverId to driver for frontend compatibility
    rides = rides.map(ride => ({
      ...ride,
      driver: ride.driverId
    }));
      
    res.json(rides);
  } catch (error) {
    console.error('Error in getRides:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single ride
// @route   GET /api/rides/:id
// @access  Public
// Debug endpoint to list all rides with booking requests
export const debugListRides = async (req: Request, res: Response) => {
  try {
    const rides = await Ride.find({})
      .populate('driverId', 'name email')
      .populate('bookingRequests.userId', 'name email')
      .lean();
    
    const simplifiedRides = rides.map(ride => ({
      _id: ride._id,
      startPoint: ride.startPoint,
      endPoint: ride.endPoint,
      driver: ride.driverId,
      availableSeats: ride.availableSeats,
      bookingRequests: ride.bookingRequests?.map(req => ({
        _id: req._id,
        userId: req.userId,
        status: req.status,
        seats: req.seats,
        createdAt: req.createdAt
      })) || []
    }));
    
    res.json({
      count: simplifiedRides.length,
      rides: simplifiedRides
    });
  } catch (error) {
    console.error('Error in debugListRides:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getRideById = async (req: Request, res: Response) => {
  try {
    console.log(`[getRideById] Fetching ride with ID: ${req.params.id}`);
    
    const ride = await Ride.findById(req.params.id)
      .populate('driverId', 'name email phone') // Populate driver info
      .populate('bookingRequests.userId', 'name email') // Populate booking request user info
      .lean() // Convert to plain JavaScript object
      .exec();
    
    if (!ride) {
      console.log(`[getRideById] Ride not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    console.log(`[getRideById] Found ride: ${ride._id} with ${ride.bookingRequests?.length || 0} booking requests`);
    
    // Log raw booking requests for debugging
    if (ride.bookingRequests?.length) {
      console.log('[getRideById] Raw booking requests:', JSON.stringify(ride.bookingRequests, null, 2));
    }
    
    // Map booking requests to include user details
    const bookingRequests = ride.bookingRequests?.map(request => {
      console.log(`[getRideById] Processing booking request: ${request._id}`);
      console.log(`[getRideById] User ID in request: ${request.userId}`);
      
      return {
        ...request,
        passenger: request.userId, // Map userId to passenger for frontend
        id: request._id.toString(), // Ensure id is a string
      };
    }) || [];
    
    // For backward compatibility, ensure driver field exists
    const rideWithDriver = {
      ...ride,
      driver: ride.driverId, // Map driverId to driver for frontend
      bookingRequests // Include populated booking requests
    };
    
    console.log(`[getRideById] Sending response with ${bookingRequests.length} booking requests`);
    res.json(rideWithDriver);
  } catch (error) {
    console.error('Error fetching ride:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a ride
// @route   POST /api/rides
// @access  Private

export const createRide = async (req: Request, res: Response) => {
  try {
    const {
      startPoint,
      endPoint,
      stoppages = [],
      travelDate,
      availableSeats,
      pricePerSeat,
    } = req.body;
    
    // Get the authenticated user's ID
    const driverId = req.user?._id;
    if (!driverId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Validate travel date is in the future
    if (new Date(travelDate) < new Date()) {
      return res.status(400).json({ message: 'Travel date must be in the future' });
    }
    
    // Create ride with ordered stoppages and driver ID
    const ride = new Ride({
      startPoint,
      endPoint,
      stoppages: Array.isArray(stoppages) 
        ? stoppages.map((s: any, index: number) => ({
            name: s.name,
            order: s.order || index + 1,
          }))
        : [],
      travelDate,
      availableSeats: parseInt(availableSeats),
      pricePerSeat: parseFloat(pricePerSeat),
      driverId, // Use the authenticated user's ID
    });
    
    console.log('Creating ride with data:', {
      ...ride.toObject(),
      driverId: ride.driverId,
    });
    
    const createdRide = await ride.save();
    res.status(201).json(createdRide);
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({ 
      message: 'Error creating ride',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// @desc    Update ride
// @route   PUT /api/rides/:id
// @access  Private
export const updateRide = async (req: Request, res: Response) => {
  try {
    const {
      startPoint,
      endPoint,
      stoppages,
      travelDate,
      availableSeats,
      pricePerSeat,
    } = req.body;
    
    const ride = await Ride.findById(req.params.id);
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    // Update fields if provided
    if (startPoint) ride.startPoint = startPoint;
    if (endPoint) ride.endPoint = endPoint;
    
    if (Array.isArray(stoppages)) {
      ride.stoppages = stoppages.map((s: any, index: number) => ({
        name: s.name,
        order: s.order || index + 1,
      }));
    }
    
    if (travelDate) {
      if (new Date(travelDate) < new Date()) {
        return res.status(400).json({ message: 'Travel date must be in the future' });
      }
      ride.travelDate = travelDate;
    }
    
    if (availableSeats) ride.availableSeats = parseInt(availableSeats);
    if (pricePerSeat) ride.pricePerSeat = parseFloat(pricePerSeat);
    
    const updatedRide = await ride.save();
    res.json(updatedRide);
  } catch (error) {
    console.error('Error updating ride:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete ride
// @route   DELETE /api/rides/:id
// @access  Private
export const deleteRide = async (req: Request, res: Response) => {
  try {
    const ride = await Ride.findById(req.params.id);
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    await ride.deleteOne();
    res.json({ message: 'Ride removed' });
  } catch (error) {
    console.error('Error deleting ride:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
