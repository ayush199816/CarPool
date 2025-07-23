import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Button, TextInput, Snackbar, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../../navigation/types';
import { uploadFile } from '../../services/apiService'; // Assuming this correctly imports your upload function

type VehicleType = 'Car' | 'Bike' | 'Scooty';
type DocumentType = 'drivingLicense' | 'aadhaarCard' | 'rc';

interface VerificationRouteParams {
  type: 'user' | 'vehicle';
}

interface Vehicle {
  id: string;
  type: VehicleType;
  number: string;
  company: string;
  model: string;
  color: string;
  rcDocument?: string;
  verified: boolean;
}

type VerificationScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Verification'>;

const VerificationScreen = () => {
  const route = useRoute<RouteProp<{ params: VerificationRouteParams }, 'params'>>();
  const navigation = useNavigation<VerificationScreenNavigationProp>();
  const { type } = route.params || { type: 'user' };
  const { user, updateVerification, isUserVerified, getVerifiedVehicles } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // User verification state
  const [drivingLicense, setDrivingLicense] = useState<string | null>(null);
  const [aadhaarCard, setAadhaarCard] = useState<string | null>(null);
  
  // Vehicle verification state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentVehicle, setCurrentVehicle] = useState<Omit<Vehicle, 'id' | 'verified'>>({
    type: 'Car',
    number: '',
    company: '',
    model: '',
    color: '',
    rcDocument: undefined,
  });
  
  const showMessage = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // Initialize with user's existing verification data
  useEffect(() => {
    const loadVerificationData = async () => {
      try {
        setIsLoading(true);
        const verifiedStatus = await isUserVerified?.();
        const userVehicles = await getVerifiedVehicles?.() || [];
        
        if (verifiedStatus) {
          setDrivingLicense(user?.verification?.documents?.drivingLicense || null);
          setAadhaarCard(user?.verification?.documents?.aadhaarCard || null);
        }
        setVehicles(userVehicles);
      } catch (error) {
        console.error('Error loading verification data:', error);
        showMessage('Failed to load verification data.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVerificationData();
  }, [isUserVerified, getVerifiedVehicles, user, showMessage]);

  useEffect(() => {
    navigation.setOptions({
      title: type === 'user' ? 'Verify User' : 'Verify Vehicle',
    });
  }, [type, navigation]);

  const pickImage = useCallback(async (setImage: (uri: string) => void) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showMessage('Permission to access media library is required!');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showMessage('Failed to pick image. Please try again.');
    }
  }, [showMessage]);
  
  const uploadDocument = useCallback(async (uri: string, documentType: DocumentType): Promise<string | null> => {
    try {
      if (!user?.name) {
        console.error('No user name found in context');
        showMessage('User information not found. Please log in again.');
        return null;
      }

      const formData = new FormData();
      const fileExtension = uri.split('.').pop() || 'jpeg';
      const uploadType = documentType === 'rc' ? 'vehicle' : 'user';
      const timestamp = Date.now();
      
      // Get the username from user context
      const userName = user.name;
      const sanitizedUsername = userName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `${sanitizedUsername}-${uploadType}-${timestamp}.${fileExtension}`;

      // Create a file object with the correct format for React Native
      const file = {
        uri,
        name: fileName,
        type: `image/${fileExtension}`,
      };

      // Log what we're about to send
      console.log('Preparing to upload file:', {
        fileName,
        fileType: `image/${fileExtension}`,
        uploadType,
        userName
      });

      // Append the file with the correct field name
      // @ts-ignore - React Native FormData requires this format
      formData.append('file', file);

      // Append other fields as strings
      formData.append('uploadType', uploadType);
      formData.append('userName', userName);
      
      // Log the form data entries for debugging
      console.log('Form data entries:');
      // @ts-ignore - entries() exists in React Native
      for (const [key, value] of formData._parts) {
        console.log(`${key}:`, value);
      }
      console.log('Uploading file with data:', {
        fileName,
        uploadType,
        userName,
        fileType: `image/${fileExtension}`,
        formData: {
          hasFile: formData.get('file') !== null,
          hasUploadType: formData.get('uploadType') === uploadType,
          hasUserName: formData.get('userName') === userName
        }
      });

      const response = await uploadFile(formData, uploadType);
      return response.fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      showMessage('Failed to upload document.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [showMessage]);

  const handleAddVehicle = async () => {
    if (vehicles.length >= 5) {
      showMessage('You can only add up to 5 vehicles.');
      return;
    }
    
    if (!currentVehicle.number || !currentVehicle.company || !currentVehicle.model || !currentVehicle.color) {
      showMessage('Please fill in all vehicle details.');
      return;
    }
    
    if (!currentVehicle.rcDocument) {
      showMessage('Please upload Registration Certificate.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const rcDocumentUrl = await uploadDocument(currentVehicle.rcDocument, 'rc');
      if (!rcDocumentUrl) {
        throw new Error('Failed to upload RC document');
      }
      
      const newVehicle: Vehicle = {
        id: Date.now().toString(),
        type: currentVehicle.type,
        number: currentVehicle.number,
        company: currentVehicle.company,
        model: currentVehicle.model,
        color: currentVehicle.color,
        rcDocument: rcDocumentUrl,
        verified: false,
      };
      
      setVehicles((prevVehicles) => [...prevVehicles, newVehicle]);
      
      setCurrentVehicle({
        type: 'Car',
        number: '',
        company: '',
        model: '',
        color: '',
        rcDocument: undefined,
      });
      
      showMessage('Vehicle added successfully!');
    } catch (error) {
      console.error('Error adding vehicle:', error);
      showMessage('Failed to add vehicle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (type === 'user') {
      if (!drivingLicense || !aadhaarCard) {
        showMessage('Please upload both Driving License and Aadhaar Card.');
        return;
      }

      try {
        setIsLoading(true);
        
        const [drivingLicenseUrl, aadhaarCardUrl] = await Promise.all([
          uploadDocument(drivingLicense, 'drivingLicense'),
          uploadDocument(aadhaarCard, 'aadhaarCard')
        ]);

        if (!drivingLicenseUrl || !aadhaarCardUrl) {
          throw new Error('Failed to upload one or more documents.');
        }

        await updateVerification?.({
          isVerified: false,
          documents: {
            drivingLicense: drivingLicenseUrl,
            aadhaarCard: aadhaarCardUrl,
            verifiedAt: new Date().toISOString(), // Consistent date format
          },
          vehicles: user?.verification?.vehicles || [], // Preserve existing vehicles from user context
        });

        showMessage('Your user verification request has been submitted for review.');
        navigation.goBack();
      } catch (error) {
        console.error('Error submitting user verification:', error);
        showMessage('Failed to submit user verification. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else { // type === 'vehicle'
      if (vehicles.length === 0) {
        showMessage('Please add at least one vehicle.');
        return;
      }
      
      try {
        setIsLoading(true);
        
        await updateVerification?.({
          isVerified: user?.verification?.isVerified || false, // Preserve user's current overall verification status
          documents: user?.verification?.documents, // Preserve existing user documents
          vehicles: vehicles, // Submit the updated list of vehicles
        });
        
        showMessage('Your vehicle information has been saved.');
        navigation.goBack();
      } catch (error) {
        console.error('Error saving vehicles:', error);
        showMessage('Failed to save vehicle information. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderUserVerification = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upload Documents</Text>
      
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => pickImage(setDrivingLicense)}
      >
        <Ionicons name="document-outline" size={32} color="#007AFF" />
        <Text style={styles.uploadButtonText}>
          {drivingLicense ? 'Driving License Uploaded' : 'Upload Driving License'}
        </Text>
        {drivingLicense && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => pickImage(setAadhaarCard)}
      >
        <Ionicons name="card-outline" size={32} color="#007AFF" />
        <Text style={styles.uploadButtonText}>
          {aadhaarCard ? 'Aadhaar Card Uploaded' : 'Upload Aadhaar Card'}
        </Text>
        {aadhaarCard && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
      </TouchableOpacity>

      <View style={styles.noteContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#666" />
        <Text style={styles.noteText}>
          Please ensure all documents are clear and all details are visible.
        </Text>
      </View>
    </View>
  );

  const renderVehicleVerification = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Add Vehicle</Text>
      
      <TextInput
        label="Vehicle Number"
        value={currentVehicle.number}
        onChangeText={(text) => setCurrentVehicle({...currentVehicle, number: text})}
        style={styles.input}
        mode="outlined"
      />
      
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Vehicle Type</Text>
        <View style={styles.pickerOptions}>
          {(['Car', 'Bike', 'Scooty'] as VehicleType[]).map((vehicleType) => (
            <TouchableOpacity
              key={vehicleType}
              style={[
                styles.pickerOption,
                currentVehicle.type === vehicleType && styles.pickerOptionSelected,
              ]}
              onPress={() => setCurrentVehicle({...currentVehicle, type: vehicleType})}
            >
              <Text style={currentVehicle.type === vehicleType ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                {vehicleType}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <TextInput
        label="Company"
        value={currentVehicle.company}
        onChangeText={(text) => setCurrentVehicle({...currentVehicle, company: text})}
        style={styles.input}
        mode="outlined"
      />
      
      <TextInput
        label="Model"
        value={currentVehicle.model}
        onChangeText={(text) => setCurrentVehicle({...currentVehicle, model: text})}
        style={styles.input}
        mode="outlined"
      />
      
      <TextInput
        label="Color"
        value={currentVehicle.color}
        onChangeText={(text) => setCurrentVehicle({...currentVehicle, color: text})}
        style={styles.input}
        mode="outlined"
      />
      
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => pickImage((uri) => setCurrentVehicle({...currentVehicle, rcDocument: uri}))}
      >
        <Ionicons name="document-attach-outline" size={32} color="#007AFF" />
        <Text style={styles.uploadButtonText}>
          {currentVehicle.rcDocument ? 'RC Uploaded' : 'Upload Registration Certificate (RC)'}
        </Text>
        {currentVehicle.rcDocument && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
      </TouchableOpacity>
      
      <Button 
        mode="contained" 
        onPress={handleAddVehicle}
        style={styles.addButton}
        labelStyle={styles.addButtonLabel}
      >
        Add Vehicle
      </Button>
      
      {vehicles.length > 0 && (
        <View style={styles.vehiclesList}>
          <Text style={styles.vehiclesListTitle}>Your Vehicles ({vehicles.length}/5)</Text>
          {vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.vehicleItem}> {/* Using vehicle.id as key */}
              <Ionicons name="car-sport" size={24} color="#007AFF" />
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>{vehicle.company} {vehicle.model}</Text>
                <Text style={styles.vehicleNumber}>{vehicle.number}</Text>
              </View>
              {vehicle.verified ? (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              ) : (
                <Ionicons name="time-outline" size={24} color="#FFA500" /> // Indicates pending verification
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderLoadingOverlay = () => (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Processing...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {type === 'user' ? renderUserVerification() : renderVehicleVerification()}
      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          style={styles.submitButton}
          labelStyle={styles.submitButtonLabel}
          disabled={isLoading}
        >
          {type === 'user' ? 'Submit Verification' : 'Save Vehicles'}
        </Button>
      </View>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
      
      {isLoading && renderLoadingOverlay()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
  },
  documentPreview: {
    width: 200,
    height: 150,
    marginTop: 10,
    borderRadius: 5,
  },
  snackbar: {
    backgroundColor: '#333',
    margin: 16,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadButtonText: {
    marginLeft: 12,
    flex: 1,
    color: '#333',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  noteText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 12,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    marginBottom: 8,
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 12,
  },
  pickerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  pickerOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pickerOptionText: {
    color: '#333', // Adjusted for better visibility when not selected
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  addButton: {
    marginTop: 8,
    backgroundColor: '#007AFF',
  },
  addButtonLabel: {
    color: '#fff',
    fontWeight: '600',
    paddingVertical: 6,
  },
  vehiclesList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  vehiclesListTitle: {
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  vehicleDetails: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleName: {
    fontWeight: '600',
    color: '#333',
  },
  vehicleNumber: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonLabel: {
    color: '#fff',
    fontWeight: '600',
    paddingVertical: 6,
  },
});

export default VerificationScreen;