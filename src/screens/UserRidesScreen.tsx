import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { SCREENS, AppStackParamList, MainTabParamList } from '../navigation/types';
import { Ride } from '../types/ride';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

// Define a local Booking type that matches the structure from the API
interface Booking {
  _id: string;
  ride: {
    _id: string;
    from: string;
    to: string;
    date: string;
    driver: {
      name: string;
    };
  };
  status: 'pending' | 'accepted' | 'rejected';
  seats: number;
  createdAt: string;
}

type UserRidesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  StackNavigationProp<AppStackParamList>
>;

type RideItemProps = {
  ride: Ride;
  type: 'created' | 'booked';
  onPress: (ride: Ride) => void;
};

const RideItem = ({ ride, type, onPress }: RideItemProps) => {
  // Safely format the date, handling potential invalid dates
  let formattedDate = 'Date not available';
  try {
    const dateObj = typeof ride.travelDate === 'string' ? new Date(ride.travelDate) : null;
    if (dateObj && !isNaN(dateObj.getTime())) {
      formattedDate = format(dateObj, 'MMM d, yyyy hh:mm a');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
  }
  
  // Get status text and color based on booking status
  const getStatusInfo = () => {
    if (type === 'created') return { text: 'Your Ride', color: colors.primary };
    
    // Use the status from the ride object with type safety
    const status = ride.status?.toLowerCase() as 'pending' | 'accepted' | 'rejected' | undefined;
    
    switch (status) {
      case 'accepted':
        return { text: 'Confirmed', color: '#4CAF50' };
      case 'rejected':
        return { text: 'Rejected', color: '#F44336' };
      case 'pending':
        return { text: 'Pending', color: '#FFC107' };
      default:
        // Default to pending if status is not set
        return { text: 'Pending', color: '#FFC107' };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <TouchableOpacity 
      style={styles.rideItem} 
      onPress={() => onPress(ride)}
      activeOpacity={0.7}
    >
      <View style={styles.rideHeader}>
        <Text style={styles.rideRoute}>
          {ride.startPoint} → {ride.endPoint}
        </Text>
        <View style={[styles.rideBadge, { backgroundColor: statusInfo.color }]}>
          <Text style={styles.rideBadgeText}>
            {statusInfo.text}
          </Text>
        </View>
      </View>
      
      <View style={styles.rideDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>{formattedDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color="#666" />
          <Text style={styles.detailText}>{ride.availableSeats} seats available</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag" size={16} color="#666" />
          <Text style={styles.detailText}>₹{ride.pricePerSeat} per seat</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const UserRidesScreen = () => {
  const [activeTab, setActiveTab] = useState<'created' | 'booked'>('created');
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { user } = useAuth();
  const { 
    state: { rides: userRides, isLoading },
    fetchRides,
    getMyBookings
  } = useRide();
  
  const navigation = useNavigation<UserRidesScreenNavigationProp>();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadData = async (isRefresh = false) => {
    if (!user?._id) return;
    
    try {
      // Only set refreshing if it's a manual refresh
      if (isRefresh) {
        setRefreshing(true);
      }
      
      if (activeTab === 'created') {
        // Fetch rides created by the user
        await fetchRides({});
      } else {
        // Fetch user's bookings
        const userBookings = await getMyBookings();
        setBookings(userBookings);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  };

  useEffect(() => {
    // Only load data when the component mounts or when the activeTab changes
    const loadInitialData = async () => {
      await loadData(false);
    };
    
    loadInitialData();
    
    // Cleanup function
    return () => {
      // Any cleanup if needed
    };
  }, [user?._id, activeTab]);

  const onRefresh = () => {
    loadData(true);
  };

  const handleRidePress = (ride: Ride) => {
    console.log('Ride pressed:', ride._id);
    if (ride._id) {
      navigation.navigate('RideDetails', { rideId: ride._id });
    } else {
      console.error('Cannot navigate: Ride ID is missing');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="car-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>
        {activeTab === 'created' 
          ? 'You haven\'t created any rides yet.' 
          : 'You haven\'t booked any rides yet.'}
      </Text>
    </View>
  );

  // Debug logging
  console.log('User ID:', user?._id);
  console.log('All user rides:', userRides);
  
  // Filter rides created by the user on the client side
  const userCreatedRides = userRides.filter(ride => {
    // Safely extract driverId whether it's an object or string
    let driverId: string | undefined;
    if (ride.driverId) {
      if (typeof ride.driverId === 'object') {
        driverId = (ride.driverId as any)._id || ride.driverId;
      } else {
        driverId = ride.driverId as string;
      }
    }
    
    console.log('Checking ride:', ride._id, 'driverId:', driverId, 'user._id:', user?._id);
    return driverId === user?._id;
  });
  
  console.log('User created rides:', userCreatedRides);
  
  // Map bookings to match the Ride type
  const bookedRides = bookings.map(booking => {
    // Type assertion to access potentially undefined properties
    const bookingAny = booking as any;
    const rideAny = booking.ride as any;
    
    console.log('Processing booking:', JSON.stringify(booking, null, 2));
    
    // Safely extract driver name and ID
    const driverName = rideAny.driver?.name || 'Unknown';
    const driverId = rideAny.driver?._id || '';
    
    // Extract price - check both booking and ride levels
    const pricePerSeat = bookingAny.pricePerSeat ?? 
                        bookingAny.price ?? 
                        rideAny.pricePerSeat ?? 
                        rideAny.price ?? 0;
    
    if (pricePerSeat === 0) {
      console.warn('No price found for booking:', booking._id, 'Using default price of 0');
    }
    
    // Create a new object that matches the Ride type
    const mappedRide: Omit<Ride, 'driverName'> & { driverName: string; status: string } = {
      _id: rideAny._id,
      id: rideAny._id,
      startPoint: rideAny.from,
      endPoint: rideAny.to,
      travelDate: rideAny.date,
      rideType: rideAny.rideType || 'intercity', // Default to 'intercity' if not provided
      driverName, // This will be used for display
      driverId,
      availableSeats: booking.seats,
      status: booking.status, // Include the status from the booking
      pricePerSeat,
      stoppages: [],
      bookingRequests: [],
      createdAt: booking.createdAt,
      updatedAt: bookingAny.updatedAt ?? booking.createdAt,
    };
    
    console.log('Mapped ride:', JSON.stringify(mappedRide, null, 2));
    return mappedRide;
  });
  
  console.log('Booked rides:', bookedRides);
  
  const data = activeTab === 'created' ? userCreatedRides : bookedRides;
  console.log('Active tab:', activeTab, 'Data to render:', data);

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'created' && styles.activeTab]}
          onPress={() => setActiveTab('created')}
        >
          <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>
            My Rides
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'booked' && styles.activeTab]}
          onPress={() => setActiveTab('booked')}
        >
          <Text style={[styles.tabText, activeTab === 'booked' && styles.activeTabText]}>
            My Bookings
          </Text>
        </TouchableOpacity>
      </View>

      {(isLoading && isInitialLoad) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => {
            // For booked rides, include the index to ensure unique keys
            // since multiple bookings can exist for the same ride
            if (activeTab === 'booked' && bookings[index]) {
              return `booking-${bookings[index]._id}`;
            }
            // For created rides, use the ride ID
            return `ride-${item._id}`;
          }}
          renderItem={({ item }) => (
            <RideItem 
              ride={item} 
              type={activeTab} 
              onPress={handleRidePress} 
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 10,
  },
  rideItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rideRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  rideBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
  },
  rideBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  rideDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  detailText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default UserRidesScreen;
