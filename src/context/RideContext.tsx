import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Ride, RideFilterParams, CreateRideInput, BookingRequest } from '../types/ride';
import { rideApi } from '../services/api';

type RideState = {
  rides: Ride[];
  isLoading: boolean;
  error: string | null;
  selectedRide: Ride | null;
};

type RideAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RIDES'; payload: Ride[] }
  | { type: 'ADD_RIDE'; payload: Ride }
  | { type: 'UPDATE_RIDE'; payload: Ride }
  | { type: 'DELETE_RIDE'; payload: string }
  | { type: 'SET_SELECTED_RIDE'; payload: Ride | null }
  | { type: 'UPDATE_BOOKING_REQUEST'; payload: { rideId: string; request: BookingRequest } };

const initialState: RideState = {
  rides: [],
  isLoading: false,
  error: null,
  selectedRide: null,
};

const rideReducer = (state: RideState, action: RideAction): RideState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RIDES':
      return { ...state, rides: action.payload };
    case 'ADD_RIDE':
      return { ...state, rides: [action.payload, ...state.rides] };
    case 'UPDATE_RIDE':
      return {
        ...state,
        rides: state.rides.map((ride) =>
          ride._id === action.payload._id ? action.payload : ride
        ),
      };
    case 'DELETE_RIDE':
      return {
        ...state,
        rides: state.rides.filter((ride) => ride._id !== action.payload),
      };
    case 'UPDATE_BOOKING_REQUEST':
      return {
        ...state,
        rides: state.rides.map(ride => {
          if (ride._id === action.payload.rideId) {
            const updatedRequests = (ride.bookingRequests || []).map(req => 
              req.id === action.payload.request.id ? action.payload.request : req
            );
            return { ...ride, bookingRequests: updatedRequests };
          }
          return ride;
        }),
        selectedRide: state.selectedRide?._id === action.payload.rideId
          ? {
              ...state.selectedRide,
              bookingRequests: (state.selectedRide.bookingRequests || []).map(req =>
                req.id === action.payload.request.id ? action.payload.request : req
              )
            }
          : state.selectedRide
      };
    case 'SET_SELECTED_RIDE':
      return { ...state, selectedRide: action.payload };
    default:
      return state;
  }
};

type Booking = {
  _id: string;
  ride: {
    _id: string;
    from: string;
    to: string;
    date: string;
    driver: {
      name: string;
    };
    pricePerSeat: number;
    price?: number;
  };
  status: 'pending' | 'accepted' | 'rejected';
  seats: number;
  pricePerSeat: number;
  price?: number;
  createdAt: string;
  updatedAt?: string;
};

type RideContextType = {
  state: RideState;
  rides: Ride[];
  loading: boolean;
  error: string | null;
  selectedRide: Ride | null;
  fetchRides: (filters?: RideFilterParams & { limit?: number }) => Promise<Ride[]>;
  getRide: (id: string) => Promise<Ride>;
  getRideById: (id: string) => Promise<Ride>;
  createRide: (rideData: CreateRideInput) => Promise<Ride>;
  updateRide: (rideData: { id: string } & Partial<CreateRideInput>) => Promise<Ride>;
  deleteRide: (id: string) => Promise<void>;
  createBookingRequest: (rideId: string, seats: number) => Promise<{ message: string; request: any }>;
  respondToBookingRequest: (rideId: string, requestId: string, status: 'accepted' | 'rejected') => Promise<void>;
  getMyBookings: () => Promise<Booking[]>;
  clearError: () => void;
  clearSelectedRide: () => void;
};

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(rideReducer, initialState);

  const setLoading = (isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  // Type guard to check if a value is a valid Date object
  const isValidDate = (date: any): date is Date => {
    return date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime());
  };

  const fetchRides = async (filters: RideFilterParams = {}) => {
    console.log('[RideContext] fetchRides called with filters:', filters);
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Clean up filters before sending to API
      const cleanFilters: RideFilterParams = { ...filters };
      
      // Format date to ISO string if it exists
      if (cleanFilters.date) {
        const dateValue = cleanFilters.date;
        if (isValidDate(dateValue)) {
          cleanFilters.date = dateValue.toISOString();
        } else if (typeof dateValue === 'string') {
          const parsedDate = new Date(dateValue);
          cleanFilters.date = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined;
        } else if (typeof dateValue === 'number') {
          const parsedDate = new Date(dateValue);
          cleanFilters.date = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined;
        }
        
        // Remove date if it's not valid after processing
        if (!cleanFilters.date) {
          delete cleanFilters.date;
          console.warn('Invalid date filter removed:', dateValue);
        }
      }
      
      console.log('[RideContext] Fetching rides with processed filters:', cleanFilters);
      
      const rides = await rideApi.getRides(cleanFilters);
      console.log(`[RideContext] Successfully fetched ${rides.length} rides`);
      
      dispatch({ type: 'SET_RIDES', payload: rides });
      return rides;
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        stack: error.stack,
      };
      
      console.error('[RideContext] Error in fetchRides:', JSON.stringify(errorDetails, null, 2));
      
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to fetch rides. Please check your connection and try again.';
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error; // Re-throw to allow components to handle the error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getRide = async (id: string) => {
    console.log(`[RideContext] getRide called with id: ${id}`);
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const ride = await rideApi.getRideById(id);
      console.log(`[RideContext] Successfully fetched ride:`, ride);
      
      dispatch({ type: 'SET_SELECTED_RIDE', payload: ride });
      return ride;
    } catch (error: any) {
      console.error(`[RideContext] Error in getRide:`, {
        id,
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });
      
      const errorMessage = error.response?.data?.message || 
                         'Failed to load ride details. Please try again.';
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getRideById = async (id: string): Promise<Ride> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const ride = await rideApi.getRideById(id);
      return ride;
    } catch (error) {
      console.error('Error fetching ride by ID:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to fetch ride details',
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createRide = async (rideData: CreateRideInput): Promise<Ride> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newRide = await rideApi.createRide(rideData);
      dispatch({ type: 'ADD_RIDE', payload: newRide });
      return newRide;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create ride';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error creating ride:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateRide = async (rideData: { id: string } & Partial<CreateRideInput>): Promise<Ride> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedRide = await rideApi.updateRide(rideData);
      dispatch({ type: 'UPDATE_RIDE', payload: updatedRide });
      return updatedRide;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update ride';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error updating ride:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteRide = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await rideApi.deleteRide(id);
      dispatch({ type: 'DELETE_RIDE', payload: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete ride';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error deleting ride:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createBookingRequest = async (rideId: string, seats: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await rideApi.createBookingRequest(rideId, seats);
      
      // Refresh the ride details to update available seats and booking requests
      if (state.selectedRide?._id === rideId) {
        await getRideById(rideId);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking request';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error creating booking request:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const respondToBookingRequest = async (rideId: string, requestId: string, status: 'accepted' | 'rejected') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Call the API to update the booking request status
      await rideApi.respondToBookingRequest(rideId, requestId, status);
      
      // Update the local state to reflect the change
      const ride = state.rides.find(r => r._id === rideId) || state.selectedRide;
      if (ride?.bookingRequests) {
        const updatedRequest = ride.bookingRequests.find(req => req.id === requestId);
        if (updatedRequest) {
          const updatedRequestWithStatus = { ...updatedRequest, status };
          dispatch({
            type: 'UPDATE_BOOKING_REQUEST',
            payload: { rideId, request: updatedRequestWithStatus }
          });
        }
      }
      
      // Refresh the ride details to ensure consistency
      await getRideById(rideId);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update booking request';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error responding to booking request:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearError = () => {
    setError(null);
  };

  const clearSelectedRide = () => {
    dispatch({ type: 'SET_SELECTED_RIDE', payload: null });
  };

  // Get all bookings for the current user
  const getMyBookings = async (): Promise<Booking[]> => {
    console.log('[RideContext] getMyBookings called');
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      console.log('[RideContext] Fetching user bookings...');
      const response = await rideApi.getMyBookings();
      
      // Log the raw response for debugging
      console.log('[RideContext] Raw bookings response:', JSON.stringify(response, null, 2));
      
      // Ensure response is an array
      if (!Array.isArray(response)) {
        const errorMessage = `Expected array but got: ${typeof response}`;
        console.error('[RideContext] Invalid bookings response format:', errorMessage);
        throw new Error('Invalid response format from server');
      }
      
      // Transform the response to match the expected Booking type
      const bookings = response
        .filter((booking: any) => {
          const isValid = booking && (booking._id || booking.rideId);
          if (!isValid) {
            console.warn('[RideContext] Invalid booking entry:', booking);
          }
          return isValid;
        })
        .map((booking: any) => {
          try {
            const pricePerSeat = booking.ride?.pricePerSeat || booking.pricePerSeat || 0;
            const bookingData: Booking = {
              _id: booking._id || `booking-${Math.random().toString(36).substr(2, 9)}`,
              pricePerSeat: pricePerSeat,
              ride: {
                _id: booking.ride?._id || booking.rideId || `ride-${Math.random().toString(36).substr(2, 9)}`,
                from: booking.ride?.startPoint || booking.startPoint || 'Unknown location',
                to: booking.ride?.endPoint || booking.endPoint || 'Unknown destination',
                date: booking.ride?.travelDate || booking.travelDate || new Date().toISOString(),
                pricePerSeat: booking.ride?.pricePerSeat || booking.pricePerSeat || 0,
                driver: booking.ride?.driver || booking.driver || { 
                  name: 'Unknown driver',
                  _id: 'unknown-driver',
                  email: ''
                },
              },
              status: booking.status || 'pending',
              seats: booking.seats || 1,
              createdAt: booking.createdAt || new Date().toISOString(),
            };
            
            // Validate required fields
            if (!bookingData.ride._id || !bookingData.ride.from || !bookingData.ride.to) {
              console.warn('[RideContext] Incomplete booking data:', bookingData);
            }
            
            return bookingData;
          } catch (mapError) {
            console.error('[RideContext] Error mapping booking:', {
              error: mapError,
              originalBooking: booking
            });
            return null;
          }
        })
        .filter((booking): booking is NonNullable<typeof booking> => booking !== null);
      
      console.log(`[RideContext] Successfully processed ${bookings.length} bookings`);
      return bookings;
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        stack: error.stack,
      };
      
      console.error('[RideContext] Error in getMyBookings:', JSON.stringify(errorDetails, null, 2));
      
      const userMessage = error.response?.data?.message || 
                        error.message || 
                        'Failed to load your bookings. Please check your connection and try again.';
      
      dispatch({ type: 'SET_ERROR', payload: userMessage });
      
      // Return empty array to prevent UI crashes, but log the error
      return [];
    }
  };

  return (
    <RideContext.Provider
      value={{
        state,
        rides: state.rides,
        loading: state.isLoading,
        error: state.error,
        selectedRide: state.selectedRide,
        fetchRides,
        getRide,
        getRideById,
        createRide,
        updateRide,
        deleteRide,
        createBookingRequest,
        respondToBookingRequest,
        getMyBookings,
        clearError,
        clearSelectedRide,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export const useRide = (): RideContextType => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};
