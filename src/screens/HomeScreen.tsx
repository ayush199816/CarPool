import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, SafeAreaView } from 'react-native';

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
    <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.headerSubtitle}>Find your perfect ride or share your journey</Text>
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
          <TouchableOpacity onPress={() => navigation.navigate('RideList')}>
            <Text style={styles.viewAllText}>See All</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 3,
    paddingTop: 50,
  },

  header: {
    padding: 20,
    paddingTop: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: colors.primary,
    paddingBottom: 60,
    overflow: 'hidden',
    marginTop: -16, // Compensate for the container padding
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.secondaryDark,
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.secondaryDark,
    marginBottom: 0,
    fontWeight: '500',
    lineHeight: 22,
    maxWidth: '90%',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 8,
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 8,
    color: colors.secondaryDark,
    marginLeft: 0,
    letterSpacing: 0.3,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(11, 31, 58, 0.08)',
  },

  actionIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  viewAllText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  ridesList: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
  },
  rideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rideInfo: {
    flex: 1,
  },
  rideRoute: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  rideDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    fontWeight: '500',
  },
  rideSeats: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  placeholderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholderText: {
    marginTop: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default HomeScreen;
