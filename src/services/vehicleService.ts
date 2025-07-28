import { API_URL } from '../Config';

export interface IVehicle {
  _id?: string;
  userId: string;
  make: string;
  modelName: string;
  year: number;
  color: string;
  licensePlate: string;
  registrationNumber: string;
  registrationExpiry: string | Date;
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceExpiry?: string | Date;
  vehicleType?: string;
  verificationDocuments?: string[];
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const addVehicle = async (token: string, vehicleData: Omit<IVehicle, '_id' | 'userId' | 'verificationStatus' | 'isActive' | 'createdAt' | 'updatedAt'>) => {
  try {

    console.log('Making request to:', `${API_URL}/vehicles`);
    const response = await fetch(`${API_URL}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(vehicleData),
    });

    const responseText = await response.text();
    let result;
    
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      throw new Error(result.message || `Failed to add vehicle: ${response.status} ${response.statusText}`);
    }

    return result;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

export const getVehicles = async (token: string): Promise<{ success: boolean; data: IVehicle[] }> => {
  try {
    console.log('Making request to:', `${API_URL}/vehicles`); // Debug log
    console.log('Using token:', token ? 'Token exists' : 'No token'); // Debug log
    
    // Using API_URL directly as it already includes /api
    const response = await fetch(`${API_URL}/vehicles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseText = await response.text();
    console.log('Raw response:', responseText); // Debug log
    
    let result;
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        response: result
      });
      throw new Error(result.message || `Failed to fetch vehicles: ${response.status} ${response.statusText}`);
    }

    return result;
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

export const updateVehicle = async (token: string, vehicleId: string, updateData: Partial<IVehicle>) => {
  try {
    console.log('Making request to:', `${API_URL}/vehicles/${vehicleId}`);
    const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    const responseText = await response.text();
    let result;
    
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        response: result
      });
      throw new Error(result.message || `Failed to update vehicle: ${response.status} ${response.statusText}`);
    }

    return result;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

export const deleteVehicle = async (token: string, vehicleId: string) => {
  try {
    console.log('Making request to:', `${API_URL}/vehicles/${vehicleId}`);
    const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseText = await response.text();
    let result: { message?: string; [key: string]: any } = {};
    
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      // For DELETE, we might get an empty response which is fine
      if (response.ok) return { success: true };
      throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        response: result
      });
      throw new Error(result.message || `Failed to delete vehicle: ${response.status} ${response.statusText}`);
    }

    return result;
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

export const addVehicleDocuments = async (token: string, vehicleId: string, documentUrls: string[]) => {
  try {

    // Using API_URL directly as it already includes /api
    console.log('Making request to:', `${API_URL}/vehicles/${vehicleId}/documents`);
    const response = await fetch(`${API_URL}/vehicles/${vehicleId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ documents: documentUrls }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to add vehicle documents');
    }

    return result;
  } catch (error) {
    console.error('Error adding vehicle documents:', error);
    throw error;
  }
};
