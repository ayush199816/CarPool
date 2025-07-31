import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  TextInput,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useRide } from '../context/RideContext';
import { SCREENS, AppStackParamList, MainTabParamList } from '../navigation/types';
import { Ride } from '../types/ride';
import { format, parseISO, isSameDay } from 'date-fns';
import debounce from 'lodash.debounce';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Define the navigation prop type for this screen
type RideListScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'RideList'>,
  StackNavigationProp<AppStackParamList>
>;

const RideListScreen = () => {
  const navigation = useNavigation<RideListScreenNavigationProp>();
  const { state, fetchRides } = useRide();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: null as Date | null,
    seats: ''
  });
  
  // Store date text separately to handle styling
  const [dateText, setDateText] = useState('Select Date');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setIsRefreshing(true);
      const filters: any = {};
      
      // Add search filters as plain values
      if (searchParams.from) {
        filters.from = searchParams.from;
      }
      if (searchParams.to) {
        filters.to = searchParams.to;
      }
      
      // Handle date filter
      if (searchParams.date) {
        const selectedDate = new Date(searchParams.date);
        filters.date = selectedDate.toISOString();
        setDateText(format(selectedDate, 'MMM dd, yyyy'));
      } else {
        setDateText('Select Date');
      }
      
      // Handle seats filter
      if (searchParams.seats) {
        const seats = parseInt(searchParams.seats, 10);
        if (!isNaN(seats) && seats > 0) {
          filters.seats = seats.toString();
        }
      }
      
      console.log('Fetching rides with filters:', JSON.stringify(filters, null, 2));
      
      // Call the fetchRides function from the RideContext
      await fetchRides(filters);
      
    } catch (error) {
      console.error('Failed to load rides:', error);
      Alert.alert('Error', 'Failed to load rides. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Debounced search function
  const debouncedSearch = React.useMemo(
    () =>
      debounce(() => {
        loadRides();
      }, 500),
    [] // Empty dependency array means this is created once on mount
  );
  
  // Debounced search trigger
  const triggerSearch = () => {
    debouncedSearch();
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Update search when filters change
  useEffect(() => {
    triggerSearch();
  }, [searchParams.from, searchParams.to, searchParams.date, searchParams.seats]);
  
  const clearFilters = () => {
    setSearchParams({
      from: '',
      to: '',
      date: null,
      seats: ''
    });
    setDateText('Select Date');
    fetchRides({});
  };

  const handleRidePress = (ride: Ride) => {
    console.log('handleRidePress called with ride:', ride);
    
    if (!ride) {
      console.error('Cannot navigate to ride details: Ride object is undefined or null');
      Alert.alert('Error', 'Cannot view ride details: Invalid ride information');
      return;
    }
    
    // Use 'id' instead of '_id' as that's what comes from the backend
    const rideId = ride.id || ride._id;
    
    if (!rideId) {
      console.error('Cannot navigate to ride details: Ride ID is missing', {
        ride,
        rideId,
        rideKeys: Object.keys(ride)
      });
      Alert.alert('Error', 'Cannot view ride details: Missing ride ID');
      return;
    }
    
    console.log('Navigating to ride details with ID:', rideId);
    navigation.navigate(SCREENS.RIDE_DETAILS, { rideId });
  };

  const RideItem = React.memo(({ item, onPress }: { item: Ride, onPress: (ride: Ride) => void }) => {
    const [showStoppages, setShowStoppages] = useState(false);
    
    return (
      <View style={styles.rideCard}>
        <TouchableOpacity onPress={() => onPress(item)}>
          <View style={styles.rideHeader}>
            <Text style={styles.rideRoute}>
              {item.startPoint} → {item.endPoint}
            </Text>
            <Text style={styles.ridePrice}>₹{item.pricePerSeat} per seat</Text>
          </View>
          
          <Text style={styles.rideDate}>
            {format(new Date(item.travelDate), 'EEE, MMM d, yyyy • h:mm a')}
          </Text>
          
          <View style={styles.rideFooter}>
            <Text style={styles.rideSeats}>
              {item.availableSeats} seat{item.availableSeats !== 1 ? 's' : ''} available
            </Text>
            {item.stoppages && item.stoppages.length > 0 && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  setShowStoppages(!showStoppages);
                }}
              >
                <Text style={styles.rideStoppages}>
                  {item.stoppages.length} stop{item.stoppages.length !== 1 ? 's' : ''} along the way {showStoppages ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
        
        {showStoppages && item.stoppages && item.stoppages.length > 0 && (
          <View style={styles.stoppagesContainer}>
            <Text style={styles.stoppagesTitle}>Stops:</Text>
            {item.stoppages.map((stop, index) => (
              <View key={index} style={styles.stoppageItem}>
                <Text style={styles.stoppageName}>{stop.name}</Text>
                {stop.rate && (
                  <Text style={styles.stoppageRate}>₹{stop.rate}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  });

  const renderRideItem = ({ item }: { item: Ride }) => (
    <RideItem item={item} onPress={handleRidePress} />
  );

  // Handle search button press
  const handleSearchPress = () => {
    // Cancel any pending debounced searches
    debouncedSearch.cancel();
    // Execute search immediately
    loadRides();
  };

  if (state.isLoading && !isRefreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {state.error}</Text>
        <TouchableOpacity onPress={loadRides} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Available Rides</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={clearFilters} style={styles.filterButton}>
            <Ionicons name="filter" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadRides} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        {/* From Input */}
        <View style={styles.largeInputContainer}>
          <Ionicons name="location" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.largeInput}
            placeholder="From (City, Location)"
            value={searchParams.from}
            onChangeText={(text) => {
              setSearchParams({...searchParams, from: text});
            }}
            placeholderTextColor="#999"
          />
        </View>
        
        {/* To Input */}
        <View style={[styles.largeInputContainer, {marginTop: 8}]}>
          <Ionicons name="location" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.largeInput}
            placeholder="To (City, Location)"
            value={searchParams.to}
            onChangeText={(text) => {
              setSearchParams({...searchParams, to: text});
            }}
            placeholderTextColor="#999"
          />
        </View>
        
        {/* Date and Seats Row */}
        <View style={styles.rowContainer}>
          {/* Date Picker */}
          <TouchableOpacity 
            style={[styles.dateInputContainer, {flex: 2, marginRight: 8}]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#666" style={styles.inputIcon} />
            <Text style={[
              styles.dateText, 
              searchParams.date ? styles.dateTextSelected : {}
            ]}>
              {dateText}
            </Text>
          </TouchableOpacity>
          
          {/* Seats Input */}
          <View style={[styles.seatsContainer, {flex: 1}]}>
            <Ionicons name="people" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.seatsInput}
              placeholder="Seats"
              value={searchParams.seats}
              onChangeText={(text) => {
                const newText = text.replace(/[^0-9]/g, '');
                setSearchParams({...searchParams, seats: newText});
              }}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>
        </View>
        
        {/* Search Button */}
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearchPress}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.searchButtonText}>Search Rides</Text>
        </TouchableOpacity>
      </View>
      
      {showDatePicker && (
        <DateTimePicker
          value={searchParams.date || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setSearchParams({...searchParams, date: selectedDate});
            }
          }}
        />
      )}

      <FlatList
        data={state.rides}
        renderItem={renderRideItem}
        keyExtractor={(item, index) => item.id || item._id || `ride-${index}`}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={loadRides}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No rides available</Text>
            <Text style={styles.emptySubtext}>
              There are no rides available at the moment.
            </Text>
          </View>
        }
      />
    </View>
  );
};

// Theme colors
const COLORS = {
  // Primary Colors
  primary: '#0B1F3A',        // Navy Blue
  primaryLight: '#1E3A5F',   // Lighter Navy
  primaryDark: '#051123',    // Darker Navy
  
  // Secondary Colors (CTAs and Highlights)
  secondary: '#FF5722',      // Flame Orange
  secondaryLight: '#FF8A50', // Lighter Orange
  secondaryDark: '#E64A19',  // Darker Orange
  
  // Accent Colors
  accent: '#FFC107',         // Amber Yellow
  accentLight: '#FFD54F',    // Lighter Amber
  accentDark: '#FFA000',     // Darker Amber
  
  // UI Colors
  background: '#F5F5F5',     // Soft Gray
  card: '#FFFFFF',           // White
  text: '#212121',           // Almost Black
  textSecondary: '#546E7A',  // Secondary Text
  border: '#B0BEC5',         // Cool Gray Blue
  white: '#FFFFFF',
  black: '#000000',
  success: '#4CAF50',
  error: '#F44336',
  
  // Additional UI Colors
  inputBackground: '#FFFFFF',
  inputBorder: '#B0BEC5',
  shadow: 'rgba(11, 31, 58, 0.1)',
  
  // Status Colors
  info: '#2196F3',
  warning: '#FFC107',
  danger: '#F44336',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  largeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  largeInput: {
    flex: 1,
    height: 56,
    color: '#333',
    fontSize: 16,
    paddingLeft: 12,
  },
  rowContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    flex: 1,
    height: 56,
    color: '#999',
    fontSize: 16,
    textAlignVertical: 'center',
    paddingLeft: 8,
  },
  dateTextSelected: {
    color: '#333',
  },
  seatsInput: {
    flex: 1,
    height: 56,
    color: '#333',
    fontSize: 16,
    paddingLeft: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: COLORS.secondaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 0,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 60,
    marginBottom: -40,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  refreshButton: {
    padding: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  rideCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopColor: COLORS.border,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rideRoute: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
    marginRight: 8,
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  ridePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '0D', // 5% opacity
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '1A', // 10% opacity
    overflow: 'hidden',
  },
  rideDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginVertical: 8,
    fontStyle: 'italic',
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rideSeats: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondaryDark,
    backgroundColor: COLORS.secondary + '0D', // 5% opacity
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.secondary + '1A', // 10% opacity
    overflow: 'hidden',
  },
  rideStoppages: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
    textDecorationLine: 'none',
    backgroundColor: COLORS.secondary + '0A', // 4% opacity
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.secondary + '1A', // 10% opacity
    overflow: 'hidden',
  },
  stoppagesContainer: {
    marginTop: 14,
    padding: 14,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  stoppagesTitle: {
    fontWeight: '600',
    marginBottom: 10,
    color: COLORS.primary,
    fontSize: 15,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  stoppageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryLight,
  },
  stoppageName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  stoppageRate: {
    fontWeight: '700',
    color: COLORS.accentDark,
    marginLeft: 10,
    backgroundColor: COLORS.accent + '1A', // 10% opacity
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent + '33', // 20% opacity
    overflow: 'hidden',
    minWidth: 50,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    maxWidth: 300,
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default RideListScreen;
