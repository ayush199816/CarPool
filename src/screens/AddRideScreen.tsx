import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRide } from '../context/RideContext';
import { useAuth } from '../context/AuthContext';
import { SCREENS } from '../navigation/types';
import { CreateRideInput } from '../types/ride';
import { TextInput } from 'react-native-paper';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddRideScreen = () => {
  const navigation = useNavigation();
  const { createRide } = useRide();
  const { user } = useAuth();
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Initialize with current date and time (next hour)
  const initialDate = new Date();
  initialDate.setHours(initialDate.getHours() + 1, 0, 0, 0);
  
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedTime, setSelectedTime] = useState<Date>(initialDate);
  
  // Initialize form data with selected date/time
  const [formData, setFormData] = useState<CreateRideInput>({
    startPoint: '',
    endPoint: '',
    travelDate: initialDate.toISOString(),
    availableSeats: 1,
    pricePerSeat: 0,
    stoppages: []
  });
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    setFormData(prev => ({
      ...prev,
      stoppages: [...prev.stoppages, { name: currentStoppage }],
    }));
    
    setCurrentStoppage('');
  };

  const handleRemoveStoppage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stoppages: prev.stoppages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
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
      
      // Create a new object without the driver field
      const { driver, ...formDataWithoutDriver } = formData as any;
      
      const rideData: CreateRideInput & { driverId: string } = {
        ...formDataWithoutDriver,
        travelDate: new Date(formData.travelDate).toISOString(),
        availableSeats: typeof formData.availableSeats === 'number' 
          ? formData.availableSeats 
          : parseInt(formData.availableSeats, 10),
        pricePerSeat: typeof formData.pricePerSeat === 'number'
          ? formData.pricePerSeat
          : parseFloat(formData.pricePerSeat),
        driverId: user._id // Only include driverId
      };
      
      console.log('Creating ride with data:', JSON.stringify(rideData, null, 2));
      
      const result = await createRide(rideData);
      console.log('Ride created successfully:', result);
      
      Alert.alert(
        'Success',
        'Ride offered successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate(SCREENS.RIDE_LIST as never),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating ride:', error);
      Alert.alert('Error', 'Failed to create ride. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.formGroup}>
        <Text style={styles.label}>From*</Text>
        <TextInput
          mode="outlined"
          placeholder="Starting point"
          value={formData.startPoint}
          onChangeText={(text) => handleInputChange('startPoint', text)}
          style={styles.input}
          theme={{
            colors: {
              primary: '#007AFF',
              background: 'white',
            },
          }}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>To*</Text>
        <TextInput
          mode="outlined"
          placeholder="Destination"
          value={formData.endPoint}
          onChangeText={(text) => handleInputChange('endPoint', text)}
          style={styles.input}
          theme={{
            colors: {
              primary: '#007AFF',
              background: 'white',
            },
          }}
        />
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
                background: 'white',
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
          value={formData.pricePerSeat as string}
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
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Stoppages (optional)</Text>
        <View style={styles.stoppageContainer}>
          <TextInput
            mode="outlined"
            placeholder="Add a stop along the way"
            value={currentStoppage}
            onChangeText={setCurrentStoppage}
            style={[styles.input, { flex: 1, marginRight: 8 }]}
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
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddStoppage}
            disabled={!currentStoppage.trim()}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {formData.stoppages.length > 0 && (
          <View style={styles.stoppagesList}>
            {formData.stoppages.map((stop, index) => (
              <View key={index} style={styles.stoppageItem}>
                <Text style={styles.stoppageText}>{stop.name}</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'white',
  },
  dateInput: {
    height: 50,
    backgroundColor: 'white',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  // iOS specific styles can be added here if needed
  stoppageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  stoppagesList: {
    marginTop: 8,
  },
  stoppageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  stoppageText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
    textAlign: 'center',
    paddingBottom: 2,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#84c1ff',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddRideScreen;
