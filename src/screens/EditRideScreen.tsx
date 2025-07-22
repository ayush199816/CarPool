import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRide } from '../context/RideContext';
import { SCREENS } from '../navigation/types';
import { Ride, UpdateRideInput } from '../types/ride';
import { TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';

const EditRideScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { ride } = route.params as { ride: Ride };
  
  const { updateRide } = useRide();
  
  // Ensure we have a valid ride ID
  if (!ride._id) {
    throw new Error('Cannot edit ride: No ride ID provided');
  }
  
  const [formData, setFormData] = useState<{
    id: string;
    startPoint: string;
    endPoint: string;
    travelDate: Date | string;
    availableSeats: string;
    pricePerSeat: string;
    stoppages: Array<{ name: string; order?: number }>;
  }>({
    id: ride._id,
    startPoint: ride.startPoint || '',
    endPoint: ride.endPoint || '',
    travelDate: ride.travelDate ? new Date(ride.travelDate) : new Date(),
    availableSeats: ride.availableSeats?.toString() || '1',
    pricePerSeat: ride.pricePerSeat?.toString() || '0',
    stoppages: ride.stoppages ? [...ride.stoppages] : [],
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentStoppage, setCurrentStoppage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: 'Edit Ride',
    });
  }, [navigation]);

  const handleInputChange = (field: keyof typeof formData, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('travelDate', selectedDate);
    }
  };

  const handleAddStoppage = () => {
    if (!currentStoppage.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      stoppages: [...(prev.stoppages || []), { name: currentStoppage }],
    }));
    
    setCurrentStoppage('');
  };

  const handleRemoveStoppage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stoppages: prev.stoppages?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.startPoint?.trim() || !formData.endPoint?.trim() || !formData.pricePerSeat) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (parseInt(formData.availableSeats as string) < 1) {
      Alert.alert('Error', 'Available seats must be at least 1');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create the update data without including the ID in the spread
      const updateData = {
        startPoint: formData.startPoint,
        endPoint: formData.endPoint,
        travelDate: formData.travelDate instanceof Date 
          ? formData.travelDate.toISOString() 
          : formData.travelDate,
        availableSeats: parseInt(formData.availableSeats as string, 10),
        pricePerSeat: parseFloat(formData.pricePerSeat as string),
        stoppages: formData.stoppages?.map((s, i) => ({
          name: s.name,
          order: i + 1
        })) || []
      };
      
      // Ensure we have a valid ride ID
      const rideId = ride._id || ride.id; // Check both _id and id for compatibility
      if (!rideId) {
        throw new Error('Cannot update ride: No valid ride ID found');
      }
      
      // Pass the ID separately
      await updateRide({
        id: rideId,
        ...updateData
      });
      
      Alert.alert(
        'Success',
        'Ride updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating ride:', error);
      Alert.alert('Error', 'Failed to update ride. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Ride</Text>
      
      <TextInput
        label="Starting Point"
        value={formData.startPoint || ''}
        onChangeText={(text) => handleInputChange('startPoint', text)}
        style={styles.input}
      />
      
      <TextInput
        label="Destination"
        value={formData.endPoint || ''}
        onChangeText={(text) => handleInputChange('endPoint', text)}
        style={styles.input}
      />
      
      <TouchableOpacity 
        style={styles.dateInput}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateText}>
          {formData.travelDate instanceof Date 
            ? format(formData.travelDate, 'MMM d, yyyy hh:mm a')
            : format(parseISO(formData.travelDate), 'MMM d, yyyy hh:mm a')}
        </Text>
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={formData.travelDate instanceof Date ? formData.travelDate : new Date(formData.travelDate)}
          mode="datetime"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}
      
      <TextInput
        label="Available Seats"
        value={formData.availableSeats?.toString() || ''}
        onChangeText={(text) => handleInputChange('availableSeats', text)}
        keyboardType="numeric"
        style={styles.input}
      />
      
      <TextInput
        label="Price per Seat"
        value={formData.pricePerSeat?.toString() || ''}
        onChangeText={(text) => handleInputChange('pricePerSeat', text)}
        keyboardType="numeric"
        style={styles.input}
      />
      
      <View style={styles.stoppageContainer}>
        <Text style={styles.sectionTitle}>Stoppages (Optional)</Text>
        <View style={styles.stoppageInputContainer}>
          <TextInput
            value={currentStoppage}
            onChangeText={setCurrentStoppage}
            placeholder="Add a stoppage"
            style={[styles.input, styles.stoppageInput]}
          />
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddStoppage}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {formData.stoppages?.map((stoppage, index) => (
          <View key={index} style={styles.stoppageItem}>
            <Text>{stoppage.name}</Text>
            <TouchableOpacity onPress={() => handleRemoveStoppage(index)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      
      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Updating...' : 'Update Ride'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stoppageContainer: {
    marginBottom: 20,
  },
  stoppageInputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stoppageInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stoppageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 8,
  },
  removeText: {
    color: 'red',
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
    backgroundColor: '#a0c4ff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditRideScreen;
