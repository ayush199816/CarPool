import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, SCREENS } from '../navigation/types';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { useRide } from '../context/RideContext';
import { Ride } from '../types/ride';
import { format } from 'date-fns';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
> & {
  navigate: (screen: 'RideDetails', params: { rideId: string }) => void;
};

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const { fetchRides, rides, loading } = useRide();
  const [recentRides, setRecentRides] = useState<Ride[]>([]);

  useEffect(() => {
    const loadRides = async () => {
      try {
        await fetchRides({ limit: 5 }); // Fetch only recent 5 rides
      } catch (error) {
        console.error('Error loading rides:', error);
      }
    };

    loadRides();
  }, []);

  useEffect(() => {
    if (rides.length > 0) {
      // Sort by date and take the most recent 3 rides
      const sortedRides = [...rides]
        .sort((a, b) => new Date(b.travelDate).getTime() - new Date(a.travelDate).getTime())
        .slice(0, 3);
      setRecentRides(sortedRides);
    }
  }, [rides]);

  const quickActions = [
    { 
      title: 'Find a Ride', 
      icon: 'search',
      onPress: () => navigation.navigate(SCREENS.RIDE_LIST as never)
    },
    { 
      title: 'Offer a Ride', 
      icon: 'add-circle',
      onPress: () => navigation.navigate(SCREENS.ADD_RIDE as never)
    },
    { 
      title: 'My Rides', 
      icon: 'list',
      onPress: () => navigation.navigate(SCREENS.RIDE_LIST as never)
    },
    { 
      title: 'Profile', 
      icon: 'person',
      onPress: () => navigation.navigate('Profile' as never)
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome to CarPool</Text>
        <Text style={styles.headerSubtitle}>Find or offer rides with trusted commuters</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.actionCard}
              onPress={action.onPress}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name={action.icon as any} size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Rides */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Rides</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Rides' as never)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.placeholderCard}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : recentRides.length > 0 ? (
          <View style={styles.ridesList}>
            {recentRides.map((ride) => (
              <TouchableOpacity 
                key={ride._id || ride.id}
                style={styles.rideCard}
                onPress={() => navigation.navigate('RideDetails', { rideId: ride._id || ride.id || '' })}
              >
                <View style={styles.rideInfo}>
                  <Text style={styles.rideRoute}>
                    {ride.startPoint} → {ride.endPoint}
                  </Text>
                  <Text style={styles.rideDate}>
                    {format(new Date(ride.travelDate), 'MMM d, yyyy • h:mm a')}
                  </Text>
                  <Text style={styles.rideSeats}>
                    {ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''} available • ₹{ride.pricePerSeat}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.placeholderCard}>
            <Ionicons name="car" size={40} color={colors.gray} />
            <Text style={styles.placeholderText}>No recent rides available</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.gray,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '500',
  },
  ridesList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  rideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  rideInfo: {
    flex: 1,
  },
  rideRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  rideDate: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
  },
  rideSeats: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  placeholderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {
    marginTop: 16,
    color: colors.gray,
    textAlign: 'center',
  },
});

export default HomeScreen;
