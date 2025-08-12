import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRide } from '../context/RideContext';
import { useAuth } from '../context/AuthContext';
import { SCREENS } from '../navigation/types';
import { CreateRideInput } from '../types/ride';
import { TextInput, Button, RadioButton, Text } from 'react-native-paper';
import { colors } from '../constants/theme';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapLocationPicker from '../components/MapLocationPicker';
import * as Location from 'expo-location';

const AddRideScreen = () => {
  const navigation = useNavigation();
  const { createRide } = useRide();
  const { user, getVerifiedVehicles } = useAuth();
  const [hasVerifiedVehicle, setHasVerifiedVehicle] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Initialize with current date and time (next hour)
  const initialDate = new Date();
  initialDate.setHours(initialDate.getHours() + 1, 0, 0, 0);
  
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedTime, setSelectedTime] = useState<Date>(initialDate);
  
  // Initialize form data with selected date/time
  const [formData, setFormData] = useState<CreateRideInput & {
    startPointAddress: string;
    endPointAddress: string;
    startPointCoords?: { latitude: number; longitude: number };
    endPointCoords?: { latitude: number; longitude: number };
  }>({
    startPoint: '',
    endPoint: '',
    startPointAddress: '',
    endPointAddress: '',
    rideType: 'in-city', // Default to in-city
    travelDate: initialDate.toISOString(),
    availableSeats: 1,
    pricePerSeat: 0,
    stoppages: []
  });

  // State for map picker
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerField, setMapPickerField] = useState<'start' | 'end'>('start');
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } else {
          console.log('Location permission denied');
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();
  }, []);
  
  // Update formData when date or time changes
  useEffect(() => {
    const combinedDate = new Date(selectedDate);
    combinedDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
    
    setFormData(prev => ({
      ...prev,
      travelDate: combinedDate.toISOString()
    }));
  }, [selectedDate, selectedTime]);
  
  const [currentStoppage, setCurrentStoppage] = useState('');
  const [currentStoppageRate, setCurrentStoppageRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkVerifiedVehicle = async () => {
      try {
        console.log('Current user:', user);
        
        if (!getVerifiedVehicles) {
          console.error('getVerifiedVehicles is not available');
          setHasVerifiedVehicle(false);
          return;
        }
        
        const verifiedVehicles = await getVerifiedVehicles();
        console.log('Verified vehicles count:', verifiedVehicles.length);
        
        const hasVehicles = verifiedVehicles.length > 0;
        console.log('Has verified vehicles:', hasVehicles);
        
        setHasVerifiedVehicle(hasVehicles);
      } catch (error) {
        console.error('Error checking verified vehicles:', error);
        setHasVerifiedVehicle(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkVerifiedVehicle();
  }, [user, getVerifiedVehicles]);

  // Handle location selection from map picker
  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    if (mapPickerField === 'start') {
      setFormData(prev => ({
        ...prev,
        startPoint: location.address,
        startPointAddress: location.address,
        startPointCoords: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        endPoint: location.address,
        endPointAddress: location.address,
        endPointCoords: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      }));
    }
    setShowMapPicker(false);
  };

  // Open map picker for start or end point
  const openMapPicker = (field: 'start' | 'end') => {
    setMapPickerField(field);
    setShowMapPicker(true);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
    }
  };

  const showDatepicker = () => setShowDatePicker(true);
  const showTimepicker = () => setShowTimePicker(true);

  const handleAddStoppage = () => {
    if (!currentStoppage.trim()) return;
    
    const rate = currentStoppageRate ? parseFloat(currentStoppageRate) : undefined;
    
    setFormData(prev => ({
      ...prev,
      stoppages: [
        ...prev.stoppages, 
        { 
          name: currentStoppage, 
          order: prev.stoppages.length + 1,
          rate: rate && !isNaN(rate) ? rate : undefined
        },
      ],
    }));
    
    setCurrentStoppage('');
    setCurrentStoppageRate('');
  };
  
  const handleStoppageRateChange = (index: number, value: string) => {
    const newStoppages = [...formData.stoppages];
    const rate = value ? parseFloat(value) : undefined;
    newStoppages[index] = {
      ...newStoppages[index],
      rate: !isNaN(rate as number) ? rate : undefined
    };
    
    setFormData(prev => ({
      ...prev,
      stoppages: newStoppages,
    }));
  };

  const handleRemoveStoppage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stoppages: prev.stoppages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!hasVerifiedVehicle) {
      Alert.alert(
        'Verification Required',
        'You need to have at least one verified vehicle to create a ride. Please verify your vehicle in the Profile section.',
        [
          {
            text: 'Go to Profile',
            onPress: () => navigation.navigate(SCREENS.PROFILE as never),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    if (!formData.startPoint || !formData.endPoint || !formData.travelDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (parseInt(formData.availableSeats as string) < 1) {
      Alert.alert('Error', 'Available seats must be at least 1');
      return;
    }

    // Ensure travel date is in the future
    const travelDate = new Date(formData.travelDate);
    const now = new Date();
    
    // Set seconds and milliseconds to 0 for accurate comparison
    now.setSeconds(0, 0);
    travelDate.setSeconds(0, 0);
    
    if (travelDate <= now) {
      Alert.alert('Error', 'Travel date must be in the future');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Log the current user to verify we have the user data
      console.log('Current user:', user);
      
      if (!user?._id) {
        throw new Error('User not authenticated or missing user ID');
      }

      // Create ride data object with explicit fields to ensure no data loss
      const rideData = {
        startPoint: formData.startPoint,
        endPoint: formData.endPoint,
        rideType: formData.rideType, // Explicitly include rideType
        travelDate: new Date(formData.travelDate).toISOString(),
        availableSeats: typeof formData.availableSeats === 'number' 
          ? formData.availableSeats 
          : parseInt(formData.availableSeats as string, 10),
        pricePerSeat: typeof formData.pricePerSeat === 'number'
          ? formData.pricePerSeat
          : parseFloat(formData.pricePerSeat as string),
        driverId: user._id,
        startPointCoords: formData.startPointCoords,
        endPointCoords: formData.endPointCoords,
        stoppages: formData.stoppages || []
      };
      
      console.log('Creating ride with data:', JSON.stringify(rideData, null, 2));
      
      console.log('Creating ride with data:', JSON.stringify(rideData, null, 2));
      
      const result = await createRide(rideData);
      console.log('Ride created successfully:', result);
      
      // Reset form
      setFormData({
        startPoint: '',
        endPoint: '',
        startPointAddress: '',
        endPointAddress: '',
        rideType: 'in-city' as const, // Set default ride type
        travelDate: initialDate.toISOString(),
        availableSeats: 1,
        pricePerSeat: 0,
        stoppages: [],
        startPointCoords: undefined,
        endPointCoords: undefined,
      });
      setCurrentStoppage('');
      setSelectedDate(initialDate);
      setSelectedTime(initialDate);

      // Navigate to ride list
      navigation.navigate(SCREENS.RIDE_LIST as never);
      Alert.alert('Success', 'Ride created successfully!');
    } catch (error: any) {
      console.error('Error creating ride:', error);
      Alert.alert('Error', error.message || 'Failed to create ride. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!hasVerifiedVehicle) {
    return (
      <View style={[styles.container, styles.center, { padding: 20 }]}>
        <Text style={styles.title}>Vehicle Required</Text>
        <Text style={styles.subtitle}>You need to have at least one verified vehicle to create a ride.</Text>
        <Text style={styles.instruction}>Please add and verify your vehicle in the Profile section.</Text>
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Text style={styles.buttonText}>Go to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Offer a New Ride</Text>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedBadgeText}>✓ Verified Vehicle</Text>
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>From*</Text>
        <View style={styles.locationInputContainer}>
          <TextInput
            label="Start Point *"
            value={formData.startPoint}
            onChangeText={(text) => handleInputChange('startPoint', text)}
            style={[styles.input, styles.locationInput]}
            mode="outlined"
            right={
              <TextInput.Icon 
                icon="map-marker" 
                onPress={() => openMapPicker('start')} 
                forceTextInputFocus={false}
              />
            }
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>To*</Text>
        <View style={styles.locationInputContainer}>
          <TextInput
            label="End Point *"
            value={formData.endPoint}
            onChangeText={(text) => handleInputChange('endPoint', text)}
            style={[styles.input, styles.locationInput]}
            mode="outlined"
            right={
              <TextInput.Icon 
                icon="map-marker" 
                onPress={() => openMapPicker('end')} 
                forceTextInputFocus={false}
              />
            }
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Date*</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={showDatepicker}
          >
            <Text style={styles.dateText}>
              {format(selectedDate, 'MMM d, yyyy')}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Time*</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={showTimepicker}
          >
            <Text style={styles.dateText}>
              {format(selectedTime, 'h:mm a')}
            </Text>
          </TouchableOpacity>
          
          {showTimePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>

        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Seats*</Text>
          <TextInput
            mode="outlined"
            placeholder="1"
            value={formData.availableSeats as string}
            onChangeText={(text) => {
              // Only allow numbers
              if (text === '' || /^\d+$/.test(text)) {
                handleInputChange('availableSeats', text);
              }
            }}
            keyboardType="numeric"
            style={styles.input}
            theme={{
              colors: {
                primary: '#007AFF',
                background: '#007AFF',
              },
            }}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Price per seat (₹)*</Text>
        <TextInput
          mode="outlined"
          placeholder="e.g. 100"
          value={formData.pricePerSeat.toString()}
          onChangeText={(text) => {
            // Only allow numbers and decimal point
            if (text === '' || /^\d*\.?\d*$/.test(text)) {
              handleInputChange('pricePerSeat', text);
            }
          }}
          keyboardType="decimal-pad"
          style={styles.input}
          left={<TextInput.Affix text="₹" />}
          theme={{
            colors: {
              primary: '#007AFF',
              background: 'white',
            },
          }}
        />
        <View style={styles.radioGroup}>
          <Text style={styles.radioLabel}>Ride Type</Text>
          <View style={styles.radioOptions}>
            <View style={[
              styles.radioOption,
              formData.rideType === 'in-city' && styles.radioOptionSelected
            ]}>
              <RadioButton.Android
                value="in-city"
                status={formData.rideType === 'in-city' ? 'checked' : 'unchecked'}
                onPress={() => setFormData({ ...formData, rideType: 'in-city' })}
                color={colors.primary}
                uncheckedColor={colors.gray}
              />
              <Text style={[
                styles.radioText,
                formData.rideType === 'in-city' && { color: colors.primary, fontWeight: '600' }
              ]}>
                In-City
              </Text>
            </View>
            <View style={[
              styles.radioOption,
              formData.rideType === 'intercity' && styles.radioOptionSelected
            ]}>
              <RadioButton.Android
                value="intercity"
                status={formData.rideType === 'intercity' ? 'checked' : 'unchecked'}
                onPress={() => setFormData({ ...formData, rideType: 'intercity' })}
                color={colors.primary}
                uncheckedColor={colors.gray}
              />
              <Text style={[
                styles.radioText,
                formData.rideType === 'intercity' && { color: colors.primary, fontWeight: '600' }
              ]}>
                Intercity
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Stoppages (optional)</Text>
        <View style={styles.stoppageContainer}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <TextInput
              mode="outlined"
              placeholder="Stop name"
              value={currentStoppage}
              onChangeText={setCurrentStoppage}
              style={[styles.input, { flex: 2, marginRight: 8 }]}
              onSubmitEditing={handleAddStoppage}
              blurOnSubmit={false}
              returnKeyType="done"
              theme={{
                colors: {
                  primary: '#007AFF',
                  background: 'white',
                },
              }}
            />
            <TextInput
              mode="outlined"
              placeholder="Rate (₹)"
              value={currentStoppageRate}
              onChangeText={setCurrentStoppageRate}
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              keyboardType="decimal-pad"
              onSubmitEditing={handleAddStoppage}
              blurOnSubmit={false}
              returnKeyType="done"
              theme={{
                colors: {
                  primary: '#007AFF',
                  background: 'white',
                },
              }}
              left={<TextInput.Affix text="₹" />}
            />
            <TouchableOpacity 
              style={[styles.addButton, { marginLeft: 0 }]}
              onPress={handleAddStoppage}
              disabled={!currentStoppage.trim()}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {formData.stoppages.length > 0 && (
          <View style={styles.stoppagesList}>
            {formData.stoppages.map((stop, index) => (
              <View key={index} style={styles.stoppageItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stoppageText}>{stop.name}</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Rate (₹)"
                    value={stop.rate?.toString() || ''}
                    onChangeText={(text) => handleStoppageRateChange(index, text)}
                    style={[styles.input, { marginTop: 4, height: 40 }]}
                    keyboardType="decimal-pad"
                    theme={{
                      colors: {
                        primary: '#007AFF',
                        background: 'white',
                      },
                    }}
                    left={<TextInput.Affix text="₹" />}
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => handleRemoveStoppage(index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Offering Ride...' : 'Offer Ride'}
        </Text>
      </TouchableOpacity>

      {/* Map Location Picker Modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        onRequestClose={() => setShowMapPicker(false)}
      >
        <View style={{ flex: 1 }}>
          <MapLocationPicker
            onLocationSelect={handleLocationSelect}
            initialLocation={{
              latitude: currentLocation?.latitude || 20.5937, // Default to center of India
              longitude: currentLocation?.longitude || 78.9629,
              address: mapPickerField === 'start' ? formData.startPoint : formData.endPoint,
            }}
            label={`Select ${mapPickerField === 'start' ? 'Pickup' : 'Drop-off'} Location`}
          />
          <Button 
            mode="contained" 
            onPress={() => setShowMapPicker(false)}
            style={styles.closeButton}
          >
            Close Map
          </Button>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: colors.primary, // Using primary color for the main background
  },
  // Form container
  formContainer: {
    flex: 1,
    padding: 16,
  },
  // Form groups
  formGroup: {
    marginBottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 0,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  // Labels
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 0.2,
    color: colors.secondaryLight,
  },
  // Input fields
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 15,
    height: 50,
    color: colors.secondaryLight,
  },
  // Radio button group
  radioGroup: {
    marginBottom: 24,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.primary,
  },
  radioOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flex: 0.48,
    justifyContent: 'center',
  },
  radioOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(11, 31, 58, 0.05)',
  },
  radioText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  // Submit button
  submitButton: {
    backgroundColor: colors.secondary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    elevation: 3,
    shadowColor: colors.secondaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  submitButtonDisabled: {
    backgroundColor: colors.secondaryLight,
    opacity: 0.7,
  },
  // Map picker
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  mapButtonText: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 2,
    marginTop: 30,
    color: colors.secondaryLight,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifiedBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.secondaryLight,
    marginLeft: 12,
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  instruction: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    elevation: 3,
    shadowColor: colors.secondaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locationInputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  locationInput: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateInput: {
    height: 52,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.secondaryLight,
    padding: 16,
    justifyContent: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
  },
  // Stoppage related styles
  stoppageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    height: 56,
    elevation: 2,
    shadowColor: colors.secondaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  stoppagesList: {
    marginTop: 8,
  },
  stoppageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stoppageText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondaryLight,
    marginLeft: 10,
  },
  removeButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: colors.secondaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default AddRideScreen;
