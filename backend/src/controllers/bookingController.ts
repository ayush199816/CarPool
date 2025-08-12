import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Ride, { IBookingRequest } from '../models/Ride';

export const createBookingRequest = async (req: Request, res: Response) => {
  try {
    const { rideId } = req.params;
    const { seats, message } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = req.user._id;

    if (!Types.ObjectId.isValid(rideId) || !Types.ObjectId.isValid(userId.toString())) {
      return res.status(400).json({ message: 'Invalid ride or user ID' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Check if seats are available
    if (ride.availableSeats < seats) {
      return res.status(400).json({ 
        message: 'Not enough seats available',
        availableSeats: ride.availableSeats 
      });
    }

    // Create new booking request
    const newRequest: Partial<IBookingRequest> = {
      userId: new Types.ObjectId(userId.toString()),
      seats,
      status: 'pending',
      message,
    };

    ride.bookingRequests.push(newRequest as IBookingRequest);
    await ride.save();

    // Populate user details in the response
    await ride.populate('bookingRequests.userId', 'name email');
    const createdRequest = ride.bookingRequests[ride.bookingRequests.length - 1];

    res.status(201).json({
      message: 'Booking request created successfully',
      bookingRequest: createdRequest,
    });
  } catch (error: unknown) {
    console.error('Error creating booking request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { rideId, requestId } = req.params;
    const { status } = req.body;
    const userId = req.user?._id; // Get user ID from the authenticated user object

    if (!Types.ObjectId.isValid(rideId) || !Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid ride or request ID' });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Verify the user is the ride owner
    if (ride.driverId.toString() !== userId?.toString()) {
      console.log('Authorization failed:', {
        rideDriverId: ride.driverId,
        userId: userId,
        types: {
          rideDriverIdType: typeof ride.driverId,
          userIdType: typeof userId
        },
        stringComparison: ride.driverId.toString() === userId?.toString(),
        directComparison: ride.driverId.toString() === userId
      });
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    const requestIndex = ride.bookingRequests.findIndex(
      (req: IBookingRequest) => req._id.toString() === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    const request = ride.bookingRequests[requestIndex];
    
    // If request is being accepted, update available seats
    if (status === 'accepted' && request.status !== 'accepted') {
      if (ride.availableSeats < request.seats) {
        if (ride.availableSeats === 0) {
          return res.status(400).json({ 
            message: 'Seats Full',
            code: 'SEATS_FULL',
            availableSeats: ride.availableSeats,
            requestedSeats: request.seats
          });
        } else {
          return res.status(400).json({ 
            message: `Only ${ride.availableSeats} seat${ride.availableSeats > 1 ? 's' : ''} available`,
            code: 'INSUFFICIENT_SEATS',
            availableSeats: ride.availableSeats,
            requestedSeats: request.seats
          });
        }
      }
      ride.availableSeats -= request.seats;
    }
    
    // If request was previously accepted and status is being changed, return the seats
    if (request.status === 'accepted' && status !== 'accepted') {
      ride.availableSeats += request.seats;
    }

    // Update the status
    request.status = status as 'accepted' | 'rejected' | 'pending';
    request.updatedAt = new Date();

    await ride.save();

    res.json({
      message: `Booking request ${status} successfully`,
      bookingRequest: request,
      availableSeats: ride.availableSeats,
    });
  } catch (error: unknown) {
    console.error('Error updating booking status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
};

export const getRideBookings = async (req: Request, res: Response) => {
  try {
    const { rideId } = req.params;
    const userId = req.user?.id; // From auth middleware

    if (!Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({ message: 'Invalid ride ID' });
    }

    const ride = await Ride.findById(rideId)
      .populate('bookingRequests.userId', 'name email')
      .select('bookingRequests driverId');

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Only the ride owner can see all booking requests
    if (ride.driverId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view these bookings' });
    }

    res.json({
      bookingRequests: ride.bookingRequests,
    });
  } catch (error: unknown) {
    console.error('Error fetching ride bookings:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
};

export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id; // From auth middleware
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Find all rides that have booking requests from this user
    const rides = await Ride.find({
      'bookingRequests.userId': new Types.ObjectId(userId),
    })
      .select('startPoint endPoint travelDate driverId bookingRequests pricePerSeat')
      .populate('driverId', 'name')
      .populate('bookingRequests.userId', 'name email');

    // Filter and format the response
    const userBookings = [];
    
    for (const ride of rides) {
      if (!ride.bookingRequests || !Array.isArray(ride.bookingRequests)) continue;
      
      const userRequests = ride.bookingRequests.filter(
        (req: IBookingRequest) => 
          req.userId && 
          (req.userId.toString() === userId.toString() || 
           (typeof req.userId === 'object' && 'id' in req.userId && req.userId.id === userId) ||
           (typeof req.userId === 'object' && '_id' in req.userId && req.userId._id.toString() === userId.toString()))
      );
      
      for (const request of userRequests) {
        userBookings.push({
          _id: request._id,
          rideId: ride._id,
          startPoint: ride.startPoint,
          endPoint: ride.endPoint,
          travelDate: ride.travelDate,
          driver: ride.driverId,
          pricePerSeat: ride.pricePerSeat,
          status: request.status,
          seats: request.seats,
          message: request.message,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        });
      }
    }

    res.json({ bookings: userBookings });
  } catch (error: unknown) {
    console.error('Error fetching user bookings:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
};
