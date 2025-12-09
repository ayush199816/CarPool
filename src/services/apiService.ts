import { API_URL } from '../Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

let currentApiUrl = API_URL;
export const setApiBaseUrl = (newUrl: string) => {
  currentApiUrl = newUrl;
};

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

type UploadType = 'user' | 'vehicle';

export const uploadFile = async (formData: FormData, type: UploadType = 'user'): Promise<{ fileUrl: string }> => {
  try {
    // Create a new FormData instance to ensure clean data
    const newFormData = new FormData();
    
    // Copy all entries from the original formData
    // @ts-ignore - entries() exists on FormData in modern browsers
    for (const [key, value] of formData.entries()) {
      // Skip any existing uploadType to avoid duplicates
      if (key === 'uploadType') continue;
      newFormData.append(key, value);
    }
    
    // Ensure uploadType is set
    newFormData.append('uploadType', type);
    
    // Log form data entries for debugging
    const formDataEntries: Record<string, any> = {};
    // @ts-ignore - entries() exists on FormData in modern browsers
    for (const [key, value] of newFormData.entries()) {
      formDataEntries[key] = value;
    }
    
    const uploadUrl = `${API_URL}/upload`;
    console.log('Attempting to upload file to:', uploadUrl);
    console.log('Upload type:', type);
    console.log('Form data entries:', formDataEntries);
    
    // Get the auth token
    const token = await getAuthToken();
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Important: Let the browser set the Content-Type with the boundary
    // Don't set Content-Type manually when sending FormData
    
    console.log('Request headers:', headers);
    
    // Log the actual content being sent
    console.log('Sending form data with entries:');
    // @ts-ignore
    for (const [key, value] of newFormData.entries()) {
      console.log(`${key}:`, value);
    }
    
    const response = await fetch(`${currentApiUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
        // Let the browser set the Content-Type with the correct boundary
      },
      body: newFormData,
    });

    console.log('Upload response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed with status:', response.status, 'Response:', errorText);
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Upload successful, response:', result);

    if (!result.success) {
      throw new Error(result.message || 'Server returned unsuccessful response');
    }

    if (!result.fileUrl) {
      throw new Error('No file URL returned from server');
    }

    return { fileUrl: result.fileUrl };
  } catch (error: unknown) {
    console.error('API Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get the authentication token from AsyncStorage
const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const submitVerification = async (
  userId: string, 
  verificationData: any
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to submit verification');
    }

    return { success: true, message: result.message || 'Verification submitted successfully' };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
