import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { User, AuthContextType } from '../types/user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          const user = await authService.getProfile(storedToken);
          setUser(user);
          setToken(storedToken);
        }
      } catch (err) {
        console.error('Failed to load user from storage', err);
        await AsyncStorage.removeItem('userToken');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      console.log('AuthContext - Attempting login with email:', email);
      const { user, token } = await authService.login({ email, password });
      console.log('AuthContext - Login successful, user:', JSON.stringify(user, null, 2));
      console.log('AuthContext - Is admin:', user?.isAdmin);
      
      setUser(user);
      setToken(token);
      await AsyncStorage.setItem('userToken', token);
      
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
