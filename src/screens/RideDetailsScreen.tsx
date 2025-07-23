import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, Image, Modal, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Define types for driver ID which can be a string or object with _id or id
interface DriverIdType {
  _id?: string;
  id?: string;
}

type DriverId = string | DriverIdType | undefined;
import { useRide } from '../context/RideContext';
import { useAuth } from '../context/AuthContext';
import { SCREENS, RootStackParamList, MainTabParamList } from '../navigation/types';
import { format, parseISO, isAfter, isBefore, isToday } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Ride, BookingRequest } from '../types/ride';

type RideDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RideDetails'> & {
  navigate: (screen: 'MainTabs', params: { screen: keyof MainTabParamList }) => void;
};
type RideDetailsScreenRouteProp = RouteProp<RootStackParamList, 'RideDetails'>;

const RideDetailsScreen = () => {
  const navigation = useNavigation<RideDetailsScreenNavigationProp>();
  const route = useRoute<RideDetailsScreenRouteProp>();
  const { rideId } = route.params;
  
  const { getRideById, respondToBookingRequest, createBookingRequest } = useRide();
  const { user } = useAuth();
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [seatsToBook, setSeatsToBook] = useState('1');
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  
  // Check if current user has a confirmed booking for this ride
  const hasConfirmedBooking = useMemo(() => {
    if (!user?._id || !ride?.bookingRequests?.length) return false;
    
    return ride.bookingRequests.some((request: any) => 
      (request.userId?._id === user._id || request.userId === user._id) && 
      request.status === 'accepted'
    );
  }, [user?._id, ride?.bookingRequests]);

  useEffect(() => {
    const loadRideDetails = async () => {
      console.log('--- loadRideDetails START ---');
      console.log('Loading ride details for ID:', rideId);
      console.log('Current user ID:', user?._id);
      
      if (!rideId) {
        const errorMsg = 'Invalid ride ID provided';
        console.error(errorMsg, { rideId, routeParams: route.params });
        setError(errorMsg);
        setIsLoading(false);
        Alert.alert('Error', 'Invalid ride information. Please try again.');
        navigation.goBack();
        return;
      }

      try {
        console.log('Calling getRideById with ID:', rideId);
        const rideData = await getRideById(rideId);
        if (!rideData) {
          throw new Error('No ride data returned from server');
        }
        
        // Log complete ride data structure
        console.log('--- RIDE DATA ---');
        console.log('Ride ID:', rideData._id || rideData.id);
        console.log('Driver ID:', rideData.driverId);
        console.log('Driver object:', rideData.driver);
        console.log('Booking requests count:', rideData.bookingRequests?.length || 0);
        
        if (rideData.bookingRequests?.length) {
          console.log('--- BOOKING REQUESTS ---');
          rideData.bookingRequests.forEach((req: any, index: number) => {
            console.log(`Request ${index + 1}:`, {
              id: req._id,
              userId: req.userId,
              status: req.status,
              seats: req.seats,
              passenger: req.passenger || 'No passenger data'
            });
          });
        } else {
          console.log('No booking requests found');
        }
        
        // Check ownership
        const userId = user?._id; // From AuthContext
        
        // Handle different possible formats of driverId
        const getDriverId = (driverObj: any): string | undefined => {
          if (!driverObj) return undefined;
          if (typeof driverObj === 'string') return driverObj;
          if (driverObj._id) return driverObj._id;
          if (driverObj.id) return driverObj.id;
          return undefined;
        };
        
        const driverId = getDriverId(rideData.driverId) || getDriverId(rideData.driver);
        
        const isOwner = userId && driverId && (userId === driverId.toString());
        
        console.log('--- OWNERSHIP CHECK ---');
        console.log('Current user ID:', userId);
        console.log('Ride driver ID:', driverId);
        console.log('Is current user the owner?', isOwner);
        
        setRide(rideData);
        setError(null);
        setIsOwner(!!isOwner);
        
        console.log('--- loadRideDetails END ---');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load ride details';
        console.error('Error loading ride details:', errorMsg, error);
        setError(errorMsg);
        Alert.alert('Error', `Could not load ride details: ${errorMsg}`);
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    loadRideDetails();
  }, [rideId, navigation, route.params]);

  const handleEdit = () => {
    if (ride) {
      (navigation as StackNavigationProp<RootStackParamList>).navigate('EditRide', { ride });
    }
  };

  const handleDelete = async () => {
    if (!ride) return;

    Alert.alert(
      'Delete Ride',
      'Are you sure you want to delete this ride? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // await deleteRide(ride._id);
              Alert.alert('Success', 'Ride deleted successfully');
              const handleNavigateToRideList = () => {
                (navigation as any).navigate('MainTabs', {
                  screen: 'RideList'
                });
              };
              handleNavigateToRideList();
            } catch (error) {
              console.error('Error deleting ride:', error);
              Alert.alert('Error', 'Failed to delete ride');
            }
          },
        },
      ]
    );
  };

  const handleCall = useCallback((phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl).then(supported => {
      if (supported) {
        Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    });
  }, []);

  const handleMessage = (phoneNumber: string) => {
    // In a real app, you would use the phone number from the ride's driver
    const messageUrl = `sms:${phoneNumber}`;
    Linking.canOpenURL(messageUrl).then(supported => {
      if (supported) {
        Linking.openURL(messageUrl);
      } else {
        Alert.alert('Error', 'Messaging is not supported on this device');
      }
    });
  };

  const handleRespondToRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!ride) return;
    
    try {
      setIsProcessing(true);
      await respondToBookingRequest(ride.id || ride._id || '', requestId, status);
      
      // Refresh the ride details to get the latest data
      const updatedRide = await getRideById(ride.id || ride._id || '');
      setRide(updatedRide);
      
      Alert.alert('Success', `Request ${status} successfully`);
    } catch (error: any) {
      console.error('Error responding to booking request:', error);
      
      let errorMessage = 'Failed to update booking request';
      
      // Check for server response with error data
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle 500 error with validation message in error field
        if (error.response.status === 500 && errorData.error) {
          // Extract the validation error message
          const validationError = errorData.error;
          if (validationError.includes('availableSeats')) {
            errorMessage = 'Cannot accept request. Not enough seats available.';
          } else {
            errorMessage = validationError;
          }
        }
        // Handle Mongoose validation errors
        else if (errorData._message === 'Ride validation failed') {
          if (errorData.errors?.availableSeats) {
            errorMessage = 'Cannot accept request. Not enough seats available.';
          } else {
            errorMessage = errorData.message || 'Validation error occurred';
          }
        }
        // Handle custom error codes
        else if (errorData.code === 'SEATS_FULL') {
          errorMessage = 'Seats are full. Cannot accept more bookings for this ride.';
        } 
        else if (errorData.code === 'INSUFFICIENT_SEATS') {
          errorMessage = `Cannot accept request. ${errorData.message || 'Not enough seats available'}.`;
        }
        // Fallback to server message if available
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } 
      // Handle network or other errors
      else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show the error message to the user
      Alert.alert('Error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderBookingRequests = () => {
    console.log('--- renderBookingRequests START ---');
    console.log('Current ride ID:', ride?._id);
    console.log('Is owner?', isOwner);
    
    if (!ride?.bookingRequests?.length) {
      console.log('No booking requests array or array is empty');
      console.log('--- renderBookingRequests END ---');
      return (
        <View style={styles.requestsContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color="#4A6FA5" />
            <Text style={styles.sectionTitle}>Booking Requests</Text>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color="#ccc" />
            <Text style={styles.emptyStateText}>No booking requests yet</Text>
          </View>
        </View>
      );
    }
    
    console.log('Raw booking requests:', JSON.stringify(ride.bookingRequests, null, 2));
    
    // Group requests by status
    const groupedRequests = ride.bookingRequests.reduce((acc: any, req: any) => {
      if (!acc[req.status]) {
        acc[req.status] = [];
      }
      acc[req.status].push(req);
      return acc;
    }, {});
    
    const statusOrder = ['pending', 'accepted', 'rejected'];
    const statusLabels = {
      pending: 'Pending Approval',
      accepted: 'Confirmed Bookings',
      rejected: 'Declined Requests'
    };
    
    console.log('Grouped requests:', Object.keys(groupedRequests));
    
    return (
      <View style={styles.requestsContainer}>
        {statusOrder.map((status) => {
          const requests = groupedRequests[status] || [];
          if (requests.length === 0) return null;
          
          return (
            <View key={status} style={styles.statusGroup}>
              <View style={styles.sectionHeader}>
                <Ionicons 
                  name={
                    status === 'pending' ? 'time-outline' : 
                    status === 'accepted' ? 'checkmark-circle-outline' : 
                    'close-circle-outline'
                  } 
                  size={20} 
                  color={
                    status === 'pending' ? '#FFA500' : 
                    status === 'accepted' ? '#4CAF50' : 
                    '#F44336'
                  } 
                />
                <Text style={styles.sectionTitle}>
                  {statusLabels[status as keyof typeof statusLabels]}
                </Text>
                <View style={[
                  styles.requestCountBadge,
                  status === 'pending' && styles.pendingBadge,
                  status === 'accepted' && styles.acceptedBadge,
                  status === 'rejected' && styles.rejectedBadge
                ]}>
                  <Text style={styles.requestCountText}>{requests.length}</Text>
                </View>
              </View>
              
              {requests.map((request: any) => (
                <View key={request._id || request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.avatar}>
                      <Ionicons 
                        name="person" 
                        size={24} 
                        color={
                          status === 'pending' ? '#4A6FA5' : 
                          status === 'accepted' ? '#4CAF50' : 
                          '#9E9E9E'
                        } 
                      />
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={[
                        styles.requestPassenger,
                        status === 'rejected' && styles.rejectedText
                      ]}>
                        {request.userId?.name || request.passenger?.name || 'Unknown User'}
                      </Text>
                      <Text style={styles.requestDate}>
                        {format(new Date(request.createdAt), 'MMM d, yyyy \at h:mm a')}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.requestDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons 
                        name="people" 
                        size={16} 
                        color={
                          status === 'pending' ? '#666' : 
                          status === 'accepted' ? '#4CAF50' : 
                          '#9E9E9E'
                        } 
                      />
                      <Text style={[
                        styles.detailText,
                        status === 'rejected' && styles.rejectedText
                      ]}>
                        {request.seats} seat{request.seats !== 1 ? 's' : ''} requested
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      status === 'pending' && styles.pendingBadge,
                      status === 'accepted' && styles.acceptedBadge,
                      status === 'rejected' && styles.rejectedBadge
                    ]}>
                      <Text style={styles.statusText}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  {status === 'pending' && isOwner && (
                    <View style={styles.requestActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRespondToRequest(request._id || request.id, 'rejected')}
                        disabled={isProcessing}
                      >
                        <Ionicons name="close" size={18} color="#fff" />
                        <Text style={styles.actionButtonText}>Decline</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleRespondToRequest(request._id || request.id, 'accepted')}
                        disabled={isProcessing}
                      >
                        <Ionicons name="checkmark" size={18} color="#fff" />
                        <Text style={styles.actionButtonText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const handleEditRide = () => {
    if (!ride) return;
    
    // Create a new ride object with the correct types
    const rideToEdit: Ride = {
      ...ride,
      _id: ride._id || ride.id || '', // Ensure we have an ID
      availableSeats: Number(ride.availableSeats) || 1,
      pricePerSeat: Number(ride.pricePerSeat) || 0,
    };
    
    navigation.navigate('EditRide', { ride: rideToEdit });
  };

  const handleBookRide = async () => {
    if (!ride) return;
    
    const seats = parseInt(seatsToBook, 10);
    if (isNaN(seats) || seats < 1 || seats > (ride.availableSeats || 1)) {
      Alert.alert('Invalid Seats', `Please enter a valid number of seats (1-${ride.availableSeats})`);
      return;
    }

    try {
      setIsProcessing(true);
      const result = await createBookingRequest(ride.id || ride._id || '', seats);
      setShowBookingModal(false);
      Alert.alert('Success', result.message || 'Booking request sent successfully!');
      
      // Refresh the ride details to update available seats and booking requests
      const updatedRide = await getRideById(ride.id || ride._id || '');
      setRide(updatedRide);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to book ride';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const rideDate = parseISO(ride.travelDate);
  const isUpcoming = isAfter(rideDate, new Date());
  const isPast = isBefore(rideDate, new Date());

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <Text style={styles.postedByText}>Posted by</Text>
          <Text style={styles.authorName}>
            {ride.driver?.name || 'Driver'}
          </Text>
        </View>
        
        <View style={styles.routeContainer}>
          <View style={styles.locationDot}>
            <View style={[styles.dot, styles.startDot]} />
            <View style={styles.line} />
            <View style={[styles.dot, styles.endDot]} />
          </View>
          <View style={styles.locations}>
            <Text style={styles.startPoint}>{ride.startPoint}</Text>
            <Text style={styles.endPoint}>{ride.endPoint}</Text>
          </View>
        </View>

        <View style={styles.dateTimeContainer}>
          <Ionicons name="calendar" size={20} color="#007AFF" style={styles.icon} />
          <Text style={styles.dateTimeText}>
            {format(rideDate, 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>
        
        <View style={styles.dateTimeContainer}>
          <Ionicons name="time" size={20} color="#007AFF" style={styles.icon} />
          <Text style={styles.dateTimeText}>
            {format(rideDate, 'h:mm a')}
          </Text>
        </View>

        {ride.stoppages && ride.stoppages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stops Along the Way</Text>
            <View style={styles.stopsContainer}>
              {ride.stoppages.map((stop, index) => (
                <View 
                  key={`stop-${stop.order || index}-${stop.name || ''}`}
                  style={styles.stopItem}
                >
                  <View style={styles.stopDot} />
                  <Text style={styles.stopText}>{stop.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        

      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={24} color="#007AFF" />
            <Text style={styles.detailText}>
              {ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''} available
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag" size={24} color="#007AFF" />
            <Text style={styles.detailText}>₹{ride.pricePerSeat} per seat</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, isUpcoming ? styles.upcomingBadge : styles.pastBadge]}>
          <Text style={styles.statusText}>
            {isUpcoming ? 'Upcoming' : isPast ? 'Completed' : 'Today'}
          </Text>
        </View>
      </View>

      <View style={styles.driverSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle-outline" size={20} color="#4A6FA5" />
          <Text style={styles.sectionTitle}>Driver Information</Text>
        </View>
        
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            {ride.driver?.avatar ? (
              <Image 
                source={{ uri: ride.driver.avatar }} 
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={30} color="#fff" />
              </View>
            )}
          </View>
          
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>
              {ride.driver?.name || 'Driver'}
            </Text>
            
            {/* Only show contact info if the user has a confirmed booking */}
            {hasConfirmedBooking ? (
              <>
                {ride.driver?.email && (
                  <View style={styles.driverDetailRow}>
                    <Ionicons name="mail" size={16} color="#4A6FA5" style={styles.detailIcon} />
                    <Text style={styles.driverDetailText}>
                      {ride.driver.email}
                    </Text>
                  </View>
                )}
                
                {ride.driver?.phone && (
                  <View style={styles.driverDetailRow}>
                    <Ionicons name="call" size={16} color="#4A6FA5" style={styles.detailIcon} />
                    <Text style={styles.driverDetailText}>
                      {ride.driver.phone}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.pendingApprovalContainer}>
                <Ionicons name="time-outline" size={16} color="#FFA500" />
                <Text style={styles.pendingApprovalText}>
                  Contact information will be available after your booking is confirmed
                </Text>
              </View>
            )}
            
            {!ride.driver?.email && !ride.driver?.phone && (
              <Text style={styles.noContactInfo}>No contact information available</Text>
            )}
          </View>
        </View>

        {(ride.driver?.phone || ride.driver?.email) && (
          <View style={styles.contactButtons}>
            {ride.driver?.phone && (
              <TouchableOpacity 
                style={[styles.contactButton, styles.callButton]}
                onPress={() => handleCall(ride.driver?.phone)}
                disabled={!ride.driver.phone}
              >
                <Ionicons name="call" size={20} color="white" />
                <Text style={styles.contactButtonText}>Call</Text>
              </TouchableOpacity>
            )}
            
            {(ride.driver?.phone || ride.driver?.email) && (
              <TouchableOpacity 
                style={[styles.contactButton, styles.messageButton]}
                onPress={() => {
                  if (ride.driver?.phone) {
                    handleMessage(ride.driver.phone);
                  } else if (ride.driver?.email) {
                    const emailUrl = `mailto:${ride.driver.email}`;
                    Linking.openURL(emailUrl);
                  }
                }}
              >
                <Ionicons 
                  name={ride.driver?.phone ? "chatbubble" : "mail"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.contactButtonText}>
                  {ride.driver?.phone ? "Message" : "Email"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {isOwner && (
        <View style={styles.ownerActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Ionicons name="create" size={20} color="#007AFF" />
            <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>
              Edit Ride
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color="#FF3B30" />
            <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>
              Delete Ride
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Booking Requests Section - Only visible to ride owner */}
      {isOwner && ride?.bookingRequests && ride.bookingRequests.length > 0 && renderBookingRequests()}
      
      {/* Book Ride Button - Only visible to non-owners for upcoming rides */}
      {!isOwner && isUpcoming && (
        <>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => setShowBookingModal(true)}
            disabled={isProcessing}
          >
            <Text style={styles.bookButtonText}>
              {isProcessing ? 'Processing...' : 'Book This Ride'}
            </Text>
          </TouchableOpacity>

          <Modal
            visible={showBookingModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowBookingModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Book Seats</Text>
                <Text style={styles.modalText}>
                  Available seats: {ride.availableSeats}
                </Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={seatsToBook}
                  onChangeText={setSeatsToBook}
                  placeholder="Number of seats"
                  placeholderTextColor="#999"
                  maxLength={2}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowBookingModal(false)}
                    disabled={isProcessing}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleBookRide}
                    disabled={isProcessing}
                  >
                    <Text style={styles.modalButtonText}>
                      {isProcessing ? 'Booking...' : 'Confirm'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  statusGroup: {
    marginBottom: 20,
  },
  acceptedBadge: {
    backgroundColor: '#E8F5E9',
  },
  rejectedBadge: {
    backgroundColor: '#FFEBEE',
  },
  rejectedText: {
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  // Pending Approval Styles
  pendingApprovalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  pendingApprovalText: {
    marginLeft: 8,
    color: '#FF8F00',
    fontSize: 14,
    flex: 1,
  },
  // Modal Styles
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  // Booking Requests Container
  requestsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  
  // Request Card
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestPassenger: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  
  // Common UI Elements
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  requestCountBadge: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  requestCountText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Author and Driver Info
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  postedByText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  // Route and Location
  routeContainer: {
    marginVertical: 15,
  },
  locationDot: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  startDot: {
    backgroundColor: '#4CAF50',
  },
  endDot: {
    backgroundColor: '#F44336',
  },
  line: {
    width: 2,
    height: 20,
    backgroundColor: '#ccc',
    marginLeft: 11,
    marginVertical: 2,
  },
  locations: {
    marginLeft: 15,
  },
  startPoint: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  endPoint: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 5,
  },
  
  // Date and Time
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
    tintColor: '#666',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#666',
  },
  
  // Ride Details Section
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Stops
  stopsContainer: {
    marginTop: 10,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
    marginRight: 10,
  },
  stopText: {
    fontSize: 14,
    color: '#666',
  },
  
  // Buttons
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  
  // Details and Status
  detailsContainer: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  
  // Status Badges
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pendingBadge: {
    backgroundColor: '#fff3e0',
  },
  upcomingBadge: {
    backgroundColor: '#E3F2FD',
  },
  pastBadge: {
    backgroundColor: '#F5F5F5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Driver Section
  driverSection: {
    marginTop: 15,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#757575',
    fontSize: 20,
    fontWeight: 'bold',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  driverDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  detailIcon: {
    width: 16,
    height: 16,
    marginRight: 5,
    tintColor: '#666',
  },
  driverDetailText: {
    fontSize: 13,
    color: '#666',
  },
  noContactInfo: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  callButton: {
    backgroundColor: '#E3F2FD',
  },
  messageButton: {
    backgroundColor: '#E8F5E9',
  },
  contactButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  ownerActions: {
    marginTop: 15,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    marginTop: 10,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    fontWeight: 'bold',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },

  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RideDetailsScreen;
