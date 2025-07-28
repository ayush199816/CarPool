import { API_URL } from '../Config';
import { User } from '../types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ADMIN_API_URL = `${API_URL}/admin`;

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingVerifications: number;
  totalRides: number;
}

export const getUserList = async (): Promise<User[]> => {
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${ADMIN_API_URL}/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch users');
  }

  return response.json();
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${ADMIN_API_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update user');
  }

  return response.json();
};

export const deleteUser = async (userId: string): Promise<void> => {
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${ADMIN_API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete user');
  }
};

export const getStats = async (): Promise<AdminStats> => {
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${ADMIN_API_URL}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch stats');
  }

  return response.json();
};
