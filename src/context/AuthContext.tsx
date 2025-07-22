import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

interface VerificationStatus {
  isVerified: boolean;
  documents?: {
    drivingLicense?: string;
    aadhaarCard?: string;
    verifiedAt?: Date | string;  // Allow both Date and string (ISO format)
  };
  vehicles?: Array<{
    id: string;
    type: 'Car' | 'Bike' | 'Scooty';
    number: string;
    company: string;
    model: string;
    color: string;
    rcDocument?: string;
    verified: boolean;
  }>;
  lastUpdated?: Date | string;  // Also update lastUpdated for consistency
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  verification?: VerificationStatus;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ user: User; token: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  updateVerification: (verificationData: VerificationStatus) => Promise<void>;
  clearError: () => void;
  isUserVerified: () => boolean;
  getVerifiedVehicles: () => Array<VerificationStatus['vehicles']>[0] | [];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');
        
        if (token && userData) {
          setToken(token);
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { user, token } = await authService.login({ email, password });
      
      // Ensure we have both user and token before proceeding
      if (!user || !token) {
        throw new Error('Invalid response from server');
      }
      
      // Store both token and user data
      await Promise.all([
        AsyncStorage.setItem('userToken', token),
        AsyncStorage.setItem('userData', JSON.stringify(user))
      ]);
      
      // Update state
      setToken(token);
      setUser(user);
      
      return { user, token };
    } catch (error: unknown) {
      console.error('Login error:', error);
      // Clear any partial data on error
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      const errorMessage = error && typeof error === 'object' && 'response' in error && 
                         error.response && typeof error.response === 'object' &&
                         'data' in error.response && error.response.data &&
                         typeof error.response.data === 'object' &&
                         'message' in error.response.data ?
                         String(error.response.data.message) : 'Failed to login. Please try again.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearError = () => setError(null);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { user, token } = await authService.register({ name, email, phone, password });
      
      // Ensure we have both user and token before proceeding
      if (!user || !token) {
        throw new Error('Invalid response from server');
      }
      
      // Store both token and user data
      await Promise.all([
        AsyncStorage.setItem('userToken', token),
        AsyncStorage.setItem('userData', JSON.stringify(user))
      ]);
      
      // Update state
      setToken(token);
      setUser(user);
      
      return { user, token };
    } catch (error: unknown) {
      console.error('Registration error:', error);
      // Clear any partial data on error
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      const errorMessage = error && typeof error === 'object' && 'response' in error && 
                         error.response && typeof error.response === 'object' &&
                         'data' in error.response && error.response.data &&
                         typeof error.response.data === 'object' &&
                         'message' in error.response.data ?
                         String(error.response.data.message) : 'Failed to register. Please try again.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    
    // Update in storage
    AsyncStorage.setItem('userData', JSON.stringify(updatedUser)).catch(console.error);
  };

  const updateVerification = async (verificationData: VerificationStatus) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      verification: {
        ...user.verification,
        ...verificationData,
        lastUpdated: new Date(),
      },
    };
    
    setUser(updatedUser);
    await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
  };

  const isUserVerified = (): boolean => {
    return user?.verification?.isVerified || false;
  };

  const getVerifiedVehicles = () => {
    if (!user?.verification?.vehicles) return [];
    return user.verification.vehicles.filter(vehicle => vehicle.verified);
  };

  const value = {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
    updateVerification,
    clearError,
    isUserVerified,
    getVerifiedVehicles,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
