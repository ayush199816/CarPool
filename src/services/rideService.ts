import axios from 'axios';
import { API_URL } from '../Config';
import { getAuthToken } from '../utils/Auth';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getMyRides = async () => {
  try {
    const [response, user] = await Promise.all([
      api.get('/rides'),
      getAuthUser()
    ]);
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Filter rides where the current user is the driver
    const myRides = response.data.filter((ride: any) => 
      ride.driverId?._id === user._id || 
      ride.driver?._id === user._id ||
      ride.driverId === user._id
    );
    
    return myRides;
  } catch (error) {
    console.error('Error fetching user rides:', error);
    throw error;
  }
};

export const getMyBookings = async () => {
  try {
    const response = await api.get('/bookings/my-bookings');
    // The backend returns { bookings: [...] } so we need to extract the array
    return response.data.bookings || [];
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

// Helper function to get the current authenticated user
export const getAuthUser = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const getRideById = async (rideId: string) => {
  try {
    const response = await api.get(`/rides/${rideId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ride details:', error);
    throw error;
  }
};

export default {
  getMyRides,
  getMyBookings,
  getRideById,
};
