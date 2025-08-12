import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, Image, Modal, TextInput } from 'react-native';
import RideMap from '../components/RideMap';
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
import { colors } from '../constants/theme';
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
    console.log('--- Checking hasConfirmedBooking ---');
    console.log('User ID:', user?._id);
    console.log('Ride booking requests:', ride?.bookingRequests);
    
    if (!user?._id || !ride?.bookingRequests?.length) {
      console.log('No user ID or booking requests');
      return false;
    }
    
    const hasBooking = ride.bookingRequests.some((request: any) => {
      const userIdMatch = request.userId?._id === user._id || 
                        request.userId === user._id ||
                        (request.passenger && request.passenger._id === user._id);
      
      const isAccepted = request.status?.toLowerCase() === 'accepted';
      
      console.log('Request check:', {
        requestId: request._id,
        requestUserId: request.userId,
        requestPassenger: request.passenger,
        userIdMatch,
        isAccepted,
        status: request.status
      });
      
      return userIdMatch && isAccepted;
    });
    
    console.log('hasBooking result:', hasBooking);
    return hasBooking;
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

      <View style={styles.mapContainer}>
        <RideMap 
          ride={{
            startPoint: ride.startPoint,
            endPoint: ride.endPoint,
            startPointCoords: ride.startPointCoords,
            endPointCoords: ride.endPointCoords
          }} 
          height={200}
        />
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
            
            {/* Show contact info if the user has a confirmed booking or is the ride owner */}
            {hasConfirmedBooking || isOwner ? (
              <>
                {ride.driver?.email ? (
                  <View style={styles.driverDetailRow}>
                    <Ionicons name="mail" size={16} color="#4A6FA5" style={styles.detailIcon} />
                    <Text style={styles.driverDetailText}>
                      {ride.driver.email}
                    </Text>
                  </View>
                ) : null}
                
                {ride.driver?.phone ? (
                  <View style={styles.driverDetailRow}>
                    <Ionicons name="call" size={16} color="#4A6FA5" style={styles.detailIcon} />
                    <Text style={styles.driverDetailText}>
                      {ride.driver.phone}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noContactInfo}>No contact information available</Text>
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
            
            {/* Vehicle Information - Show if vehicle data is available and user has confirmed booking or is the ride owner */}
            {ride.vehicleId && (hasConfirmedBooking || isOwner) && (
              <View style={styles.vehicleInfoContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="car-sport-outline" size={20} color="#4A6FA5" />
                  <Text style={styles.sectionTitle}>Vehicle Information</Text>
                </View>
                
                {typeof ride.vehicleId === 'object' ? (
                  <View style={styles.vehicleDetails}>
                    <Text style={styles.vehicleName}>
                      {ride.vehicleId.make} {ride.vehicleId.modelName} ({ride.vehicleId.year})
                    </Text>
                    <View style={styles.vehicleDetailRow}>
                      <Ionicons name="pricetag" size={16} color="#4A6FA5" style={styles.detailIcon} />
                      <Text style={styles.vehicleDetailText}>
                        {ride.vehicleId.color} • {ride.vehicleId.registrationNumber}
                      </Text>
                    </View>
                    {ride.vehicleId.verificationStatus === 'verified' && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                        <Text style={styles.verifiedBadgeText}>Verified</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.vehicleLoadingText}>Loading vehicle details...</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Show contact buttons only if user has a confirmed booking or is the ride owner */}
        {(hasConfirmedBooking || isOwner) && (ride.driver?.phone || ride.driver?.email) && (
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
              disabled={!ride.driver?.phone && !ride.driver?.email}
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
          </View>
        )}
      </View>

      {isOwner && (
        <View style={styles.ownerActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Ionicons name="create" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>
              Edit Ride
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>
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
          {hasConfirmedBooking ? (
            <View style={styles.bookingConfirmedContainer}>
              <Text style={styles.bookingConfirmedText}>You are already booked</Text>
              <Text style={styles.paymentAmountText}>
                Amount to pay: ₹{ride.pricePerSeat * (ride.bookingRequests?.find((req: any) => {
                  const userId = typeof req.userId === 'string' ? req.userId : req.userId?._id;
                  const passengerId = req.passenger?._id || (typeof req.passenger === 'string' ? req.passenger : null);
                  return (userId === user?._id || passengerId === user?._id) && req.status === 'accepted';
                })?.seats || 1)}
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={() => setShowBookingModal(true)}
              disabled={isProcessing}
            >
              <Text style={styles.bookButtonText}>
                {isProcessing ? 'Processing...' : 'Book This Ride'}
              </Text>
            </TouchableOpacity>
          )}

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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    marginBottom: 20,
  },
  // Driver Section
  driverSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 15,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  vehicleInfoContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  vehicleDetails: {
    marginLeft: 8,
    marginTop: 8,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  vehicleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  vehicleLoadingText: {
    fontStyle: 'italic',
    color: '#999',
    fontSize: 14,
    marginLeft: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  verifiedBadgeText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  mapContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  // Layout
  scrollContent: {
    paddingBottom: 30,
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
    padding: 30,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Booking Confirmation Styles
  bookingConfirmedContainer: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  bookingConfirmedText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentAmountText: {
    color: '#2E7D32',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  emptyStateText: {
    marginTop: 15,
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
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
  
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 10,
    letterSpacing: 0.5,
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
    color: colors.secondaryLight,
    marginRight: 5,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondaryLight,
  },
  
  // Route and Location
  routeContainer: {
    marginVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 18,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
    flex: 1,
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
    marginLeft: 0,
    marginVertical: 2,
  },
  locations: {
    marginLeft: 30,
    marginTop: -40,
  },
  startPoint: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 5,
  },
  endPoint: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
    color: colors.secondary,
  },
  
  // Date and Time
  
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    color: colors.secondary,
    
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
    tintColor: '#666',
    color: colors.secondary,
  },
  
  // Ride Details Header
  header: {
    
    padding: 25,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 15,
  },
  headerContent: {
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  routeInfo: {
    flex: 1,
    marginLeft: 10,
  },
  routeText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 3,
    fontWeight: '500',
  },
  routeArrow: {
    color: colors.secondary,
    marginHorizontal: 5,
  },
  
  // Stops
  stopsContainer: {
    marginTop: 0,
  },
  stopItem: {
    color: colors.secondaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginRight: 10,
  },
  stopText: {
    fontSize: 14,
    color: colors.secondaryLight,
  },
  
  // Buttons
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  bookButton: {
    backgroundColor: colors.secondary,
    margin: 20,
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: '700',
  },
  // Details and Status
  detailsContainer: {
    backgroundColor: colors.card,
    margin: 15,
    marginTop: -15,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 15,
    color: colors.secondaryLight,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Date Time Text
  dateTimeText: {
    fontSize: 15,
    color: colors.secondaryLight,
    fontWeight: '500',
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
  // Section
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
    color: colors.secondary, // Orange color from theme
    marginBottom: 5,
  },
  // Driver Details and Contact Styles
  driverDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    color: '#666',
  },
  driverDetailText: {
    fontSize: 15,
    color: colors.secondaryDark, // Darker orange for better contrast
    flex: 1,
  },
  noContactInfo: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 5,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  callButton: {
    backgroundColor: '#FFF3E0', // Light orange background for call button
    borderWidth: 1,
    borderColor: colors.secondaryLight,
  },
  messageButton: {
    backgroundColor: '#FFF3E0', // Light orange background for message button
    borderWidth: 1,
    borderColor: colors.secondaryLight,
  },
  contactButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary, // Orange color for contact button text
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

  // Error and Retry
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
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
    padding: 10,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: colors.secondaryLight,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

});

export default RideDetailsScreen;
