import { API_URL } from '../Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VehicleVerification {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const VERIFICATION_API_URL = `${API_URL}/verifications`;

export const getPendingVerifications = async (): Promise<VehicleVerification[]> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) throw new Error('No authentication token found');
    
    const response = await fetch(`${VERIFICATION_API_URL}/pending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to fetch pending verifications';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getPendingVerifications:', error);
    throw error;
  }
};

export const updateVerificationStatus = async (
  verificationId: string, 
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<VehicleVerification> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) throw new Error('No authentication token found');
    
    const response = await fetch(`${VERIFICATION_API_URL}/${verificationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status, rejectionReason }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to update verification status';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in updateVerificationStatus:', error);
    throw error;
  }
};

export const getVerificationHistory = async (userId?: string): Promise<VehicleVerification[]> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) throw new Error('No authentication token found');
    
    const url = userId ? `${VERIFICATION_API_URL}/user/${userId}` : `${VERIFICATION_API_URL}/history`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to fetch verification history';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getVerificationHistory:', error);
    throw error;
  }
};
