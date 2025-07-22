import { API_URL } from '../Config';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

type UploadType = 'user' | 'vehicle';

export const uploadFile = async (formData: FormData, type: UploadType = 'user'): Promise<{ fileUrl: string }> => {
  try {
    // Add upload type to form data
    formData.append('uploadType', type);
    
    const uploadUrl = `${API_URL}/upload`;
    console.log('Attempting to upload file to:', uploadUrl);
    console.log('Upload type:', type);
    
    // Don't set Content-Type header - let the browser set it with the correct boundary
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('Upload response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed with status:', response.status, 'Response:', errorText);
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
    }

    const result: ApiResponse<{ fileUrl: string }> = await response.json();
    console.log('Upload successful, response:', result);

    if (!result.success) {
      throw new Error(result.error || 'Server returned unsuccessful response');
    }

    if (!result.data?.fileUrl) {
      throw new Error('No file URL returned from server');
    }

    return { fileUrl: result.data.fileUrl };
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
