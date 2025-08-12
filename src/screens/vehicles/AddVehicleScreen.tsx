import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Button, TextInput, Text, useTheme, HelperText, SegmentedButtons } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/types';
import { addVehicle } from '../../services/vehicleService';
import { useAuth } from '../../context/AuthContext';

type AddVehicleScreenNavigationProp = StackNavigationProp<AppStackParamList, 'AddVehicle'>;
type AddVehicleScreenRouteProp = RouteProp<AppStackParamList, 'AddVehicle'>;

type Props = {
  navigation: AddVehicleScreenNavigationProp;
  route: AddVehicleScreenRouteProp;
};

const AddVehicleScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    make: '',
    modelName: '',
    year: '',
    color: '',
    licensePlate: '',
    registrationNumber: '',
    registrationExpiry: '',
    insuranceProvider: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    vehicleType: 'car', // 'car', 'bike', or 'scooty'
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required';
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.modelName.trim()) newErrors.modelName = 'Model is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.color.trim()) newErrors.color = 'Color is required';
    if (!formData.licensePlate.trim()) newErrors.licensePlate = 'License plate is required';
    if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
    if (!formData.registrationExpiry) newErrors.registrationExpiry = 'Registration expiry is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const vehicleData = {
        ...formData,
        year: parseInt(formData.year, 10),
        registrationExpiry: formData.registrationExpiry,
        insuranceExpiry: formData.insuranceExpiry || undefined,
        insuranceProvider: formData.insuranceProvider || undefined,
        insuranceNumber: formData.insuranceNumber || undefined,
      };
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      await addVehicle(token, vehicleData);
      
      Alert.alert(
        'Success',
        'Vehicle added successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to add vehicle. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Vehicle</Text>
      
      <Text style={styles.sectionTitle}>Vehicle Type *</Text>
      <SegmentedButtons
        value={formData.vehicleType}
        onValueChange={(value) => handleChange('vehicleType', value)}
        buttons={[
          {
            value: 'car',
            label: 'Car',
            icon: 'car',
          },
          {
            value: 'bike',
            label: 'Bike',
            icon: 'motorbike',
          },
          {
            value: 'scooty',
            label: 'Scooty',
            icon: 'scooter',
          },
        ]}
        style={styles.segmentedButton}
      />
      <HelperText type="error" visible={!!errors.vehicleType}>
        {errors.vehicleType}
      </HelperText>
      
      <TextInput
        label="Make *"
        value={formData.make}
        onChangeText={(text) => handleChange('make', text)}
        style={styles.input}
        error={!!errors.make}
      />
      <HelperText type="error" visible={!!errors.make}>
        {errors.make}
      </HelperText>

      <TextInput
        label="Model *"
        value={formData.modelName}
        onChangeText={(text) => handleChange('modelName', text)}
        style={styles.input}
        error={!!errors.modelName}
      />
      <HelperText type="error" visible={!!errors.modelName}>
        {errors.modelName}
      </HelperText>

      <TextInput
        label="Year *"
        value={formData.year}
        onChangeText={(text) => handleChange('year', text)}
        keyboardType="numeric"
        style={styles.input}
        error={!!errors.year}
      />
      <HelperText type="error" visible={!!errors.year}>
        {errors.year}
      </HelperText>

      <TextInput
        label="Color *"
        value={formData.color}
        onChangeText={(text) => handleChange('color', text)}
        style={styles.input}
        error={!!errors.color}
      />
      <HelperText type="error" visible={!!errors.color}>
        {errors.color}
      </HelperText>

      <TextInput
        label="License Plate *"
        value={formData.licensePlate}
        onChangeText={(text) => handleChange('licensePlate', text.toUpperCase())}
        style={styles.input}
        error={!!errors.licensePlate}
      />
      <HelperText type="error" visible={!!errors.licensePlate}>
        {errors.licensePlate}
      </HelperText>

      <TextInput
        label="Registration Number *"
        value={formData.registrationNumber}
        onChangeText={(text) => handleChange('registrationNumber', text.toUpperCase())}
        style={styles.input}
        error={!!errors.registrationNumber}
      />
      <HelperText type="error" visible={!!errors.registrationNumber}>
        {errors.registrationNumber}
      </HelperText>

      <TextInput
        label="Registration Expiry (YYYY-MM-DD) *"
        value={formData.registrationExpiry}
        onChangeText={(text) => handleChange('registrationExpiry', text)}
        placeholder="YYYY-MM-DD"
        style={styles.input}
        error={!!errors.registrationExpiry}
      />
      <HelperText type="error" visible={!!errors.registrationExpiry}>
        {errors.registrationExpiry}
      </HelperText>

      <TextInput
        label="Insurance Provider"
        value={formData.insuranceProvider}
        onChangeText={(text) => handleChange('insuranceProvider', text)}
        style={styles.input}
      />

      <TextInput
        label="Insurance Number"
        value={formData.insuranceNumber}
        onChangeText={(text) => handleChange('insuranceNumber', text)}
        style={styles.input}
      />

      <TextInput
        label="Insurance Expiry (YYYY-MM-DD)"
        value={formData.insuranceExpiry}
        onChangeText={(text) => handleChange('insuranceExpiry', text)}
        placeholder="YYYY-MM-DD"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
        loading={isLoading}
        disabled={isLoading}
      >
        Add Vehicle
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 8,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  segmentedButton: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
});

export default AddVehicleScreen;
