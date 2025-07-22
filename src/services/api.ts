import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ride, RideFilterParams, CreateRideInput, UpdateRideInput } from '../types/ride';

// Debug function to log API calls
const debugApiCall = (config: AxiosRequestConfig) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
    baseURL: config.baseURL,
    params: config.params,
    headers: {
      ...config.headers,
      // Don't log the full auth token
      Authorization: config.headers?.Authorization ? 'Bearer [TOKEN]' : undefined,
    },
  });
};

// API Configuration
let API_URL: string;

if (__DEV__) {
  // For Android emulator, use 10.0.2.2 to access localhost on the host machine
  // For physical devices, use your computer's local IP address
  const isAndroidEmulator = Platform.OS === 'android' && !__DEV__;
  const host = isAndroidEmulator ? '10.0.2.2' : '192.168.31.174';
  API_URL = `http://${host}:5000/api`;
} else {
  API_URL = 'https://your-production-api.com/api';
}

console.log('Using API URL:', API_URL);
console.log('Platform:', Platform.OS);

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token and debug info
api.interceptors.request.use(
  async (config) => {
    try {
      // Skip token for auth endpoints
      const isAuthEndpoint = config.url?.startsWith('/auth');
      
      if (!isAuthEndpoint) {
        try {
          const token = await AsyncStorage.getItem('userToken');
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
            console.log('[API] Added auth token to request headers');
          } else {
            console.warn('[API] No auth token found in storage');
          }
        } catch (tokenError) {
          console.error('[API] Error getting auth token:', tokenError);
          // Don't block the request if we can't get the token
        }
      }
      
      // Log the request for debugging
      debugApiCall(config);
      
      return config;
    } catch (error: any) {
      console.error('[API] Request interceptor error:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        url: config?.url,
        method: config?.method,
      });
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('[API] Request interceptor error (outer):', {
      message: error.message,
      code: error.code,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
      } : 'No config',
    });
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      data: response.data,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Don't process if we don't have a response (network error)
    if (!error.response) {
      const errorMessage = error.message === 'Network Error' 
        ? 'Unable to connect to the server. Please check your internet connection and try again.'
        : error.message || 'A network error occurred. Please check your connection.';
      
      console.error('[API] Network Error:', errorMessage);
      Alert.alert('Connection Error', errorMessage);
      return Promise.reject(error);
    }
    
    // Log detailed error information for debugging
    const errorDetails = {
      message: error.message,
      code: error.code,
      status: error.response.status,
      statusText: error.response.statusText,
      url: originalRequest?.url,
      method: originalRequest?.method,
      responseData: error.response.data,
    };
    
    console.error('[API] Response Error:', JSON.stringify(errorDetails, null, 2));
    
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response.status === 401) {
      // If this is a retry after a failed token refresh, don't try again
      if (originalRequest._retry) {
        console.warn('[API] Already attempted token refresh, logging out');
        await AsyncStorage.multiRemove(['userToken', 'user']);
        Alert.alert(
          'Session Expired', 
          'Your session has expired. Please log in again.',
          [{ text: 'OK' }]
        );
        return Promise.reject(error);
      }
      
      // Mark this request to avoid infinite loops
      originalRequest._retry = true;
      
      try {
        console.log('[API] Attempting to refresh token...');
        // TODO: Implement token refresh logic here if your API supports it
        // For now, we'll just clear the token and ask the user to log in again
        await AsyncStorage.multiRemove(['userToken', 'user']);
        
        Alert.alert(
          'Session Expired', 
          'Your session has expired. Please log in again.',
          [{ 
            text: 'OK',
            onPress: () => {
              // Navigate to login screen
              // You might need to use a navigation ref or event emitter here
              console.log('[API] Redirecting to login...');
            }
          }]
        );
        
        return Promise.reject(error);
      } catch (refreshError) {
        console.error('[API] Error during token refresh:', refreshError);
        await AsyncStorage.multiRemove(['userToken', 'user']);
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other error statuses with appropriate user feedback
    if (error.response.data) {
      const errorMessage = error.response.data.message || 
                         error.response.data.error || 
                         `Error: ${error.response.status} - ${error.response.statusText}`;
      
      console.error('[API] Server Error:', errorMessage);
      
      // Only show alert for client errors (4xx) and server errors (5xx)
      if (error.response.status >= 400) {
        Alert.alert('Error', errorMessage);
      }
    } else {
      console.error('[API] Unknown Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const rideApi = {
  // Get all rides with optional filters
  getRides: async (filters: RideFilterParams = {}): Promise<Ride[]> => {
    try {
      // Convert date to ISO string if it's a Date object
      const params: Record<string, any> = { ...filters };
      if (params.date && typeof params.date.toISOString === 'function') {
        params.date = params.date.toISOString();
      }
      
      const response = await api.get<Ride[]>('/rides', { params });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching rides:', error);
      throw error;
    }
  },

  // Get a single ride by ID
  getRideById: async (id: string): Promise<Ride> => {
    try {
      const response = await api.get<Ride>(`/rides/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ride ${id}:`, error);
      throw error;
    }
  },

  // Create a new ride
  createRide: async (rideData: CreateRideInput): Promise<Ride> => {
    try {
      // Log the input data for debugging
      console.log('[API] createRide input:', JSON.stringify(rideData, null, 2));
      
      // Convert string numbers to actual numbers
      const payload = {
        ...rideData,
        availableSeats: Number(rideData.availableSeats),
        pricePerSeat: Number(rideData.pricePerSeat),
        // Only include driverId, not driver
        ...(rideData.driverId && { 
          driverId: rideData.driverId
        }),
        // Add order to stoppages if not provided
        stoppages: rideData.stoppages?.map((stop, index) => ({
          name: stop.name,
          order: index + 1,
        })) || [],
      };
      
      console.log('[API] Sending create ride payload:', JSON.stringify(payload, null, 2));
      
      // Log the headers being sent
      console.log('[API] Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': api.defaults.headers.common['Authorization']
      });
      
      const response = await api.post<Ride>('/rides', payload);
      
      console.log('[API] Ride created successfully:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Error creating ride:', error);
      throw error;
    }
  },

  // Update an existing ride
  updateRide: async ({ id, ...rideData }: UpdateRideInput): Promise<Ride> => {
    try {
      const payload: Record<string, any> = { ...rideData };
      
      // Convert string numbers to actual numbers if they exist
      if (payload.availableSeats !== undefined) {
        payload.availableSeats = Number(payload.availableSeats);
      }
      if (payload.pricePerSeat !== undefined) {
        payload.pricePerSeat = Number(payload.pricePerSeat);
      }
      
      // Handle stoppages if provided
      if (payload.stoppages) {
        payload.stoppages = payload.stoppages.map((stop: { name: string }, index: number) => ({
          name: stop.name,
          order: index + 1,
        }));
      }
      
      const response = await api.put<Ride>(`/rides/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating ride ${id}:`, error);
      throw error;
    }
  },

  // Delete a ride
  deleteRide: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete<{ message: string }>(`/rides/${id}`);
      return { message: response.data.message || 'Ride deleted successfully' };
    } catch (error) {
      console.error(`Error deleting ride ${id}:`, error);
      throw error;
    }
  },
  
  // Create a new booking request
  createBookingRequest: async (rideId: string, seats: number): Promise<{ message: string; request: any }> => {
    try {
      const response = await api.post<{ message: string; request: any }>(
        `/rides/${rideId}/bookings`,
        { seats }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating booking request:', error);
      throw error;
    }
  },

  // Respond to a booking request
  respondToBookingRequest: async (
    rideId: string, 
    requestId: string, 
    status: 'accepted' | 'rejected'
  ): Promise<{ message: string }> => {
    try {
      const response = await api.patch<{ message: string }>(
        `/rides/${rideId}/bookings/${requestId}`,
        { status }
      );
      return { message: response.data.message || 'Booking request updated successfully' };
    } catch (error) {
      console.error('Error responding to booking request:', error);
      throw error;
    }
  },

  // Get all bookings for the current user
  getMyBookings: async (): Promise<Array<{
    _id: string;
    ride: {
      _id: string;
      from: string;
      to: string;
      date: string;
      driver: {
        name: string;
      };
    };
    status: 'pending' | 'accepted' | 'rejected';
    seats: number;
    createdAt: string;
  }>> => {
    try {
      const response = await api.get('/bookings/my-bookings');
      return response.data.bookings || [];
    } catch (error) {
      console.error('[API] Error fetching user bookings:', error);
      throw error;
    }
  },
};

export default api;
