import api from './api';
interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  // Login user with email and password
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post<any>('/auth/login', credentials);
      
      // Transform the response to match the expected LoginResponse structure
      return {
        user: {
          _id: response.data._id,
          email: response.data.email,
          name: response.data.name,
          phone: response.data.phone
        },
        token: response.data.token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register a new user
  register: async (userData: RegisterCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post<any>('/auth/register', userData);
      
      // Transform the response to match the expected LoginResponse structure
      return {
        user: {
          _id: response.data._id,
          email: response.data.email,
          name: response.data.name,
          phone: response.data.phone
        },
        token: response.data.token
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Get current user's profile
  getProfile: async (token: string): Promise<User> => {
    try {
      const response = await api.get<User>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
};
