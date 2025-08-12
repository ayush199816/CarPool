import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SCREENS } from '../navigation/types';
import { getVehicles } from '../services/vehicleService';
import { useEffect, useState } from 'react';

const ProfileScreen = () => {
  const { user, logout, isUserVerified, getVerifiedVehicles, token } = useAuth();
  
  // Debug log to check user object and admin status
  React.useEffect(() => {
    console.log('ProfileScreen - User object:', JSON.stringify(user, null, 2));
    console.log('Is admin:', user?.isAdmin);
  }, [user]);
  const navigation = useNavigation();
  const verifiedVehicles = getVerifiedVehicles() || [];
  const [userVehicles, setUserVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadVehicles = async () => {
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      try {
        setIsLoading(true);
        console.log('Loading vehicles with token:', token); // Debug log
        const response = await getVehicles(token);
        console.log('Vehicles response:', response); // Debug log
        if (response?.success && response.data) {
          setUserVehicles(response.data);
        }
      } catch (error) {
        console.error('Error loading vehicles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?._id && token) {
      loadVehicles();
    }
  }, [user?._id]);

  const navigateToAddVehicle = () => {
    // @ts-ignore - navigation type issue
    navigation.navigate('AddVehicle');
  };

  const navigateToVerification = (type: 'user' | 'vehicle') => {
    // @ts-ignore - navigation type issue
    navigation.navigate(SCREENS.VERIFICATION, { type });
  };
  
  const getVerificationStatus = () => {
    if (!user?.verification) return 'Not Verified';
    return user.verification.isVerified ? 'Verified':'Verified';
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={60} color="#fff" />
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <View style={[styles.verificationBadge, isUserVerified() ? styles.verifiedBadge : styles.pendingBadge]}>
          <Ionicons 
            name={isUserVerified() ? "checkmark-circle" : "time"} 
            size={16} 
            color="#fff" 
            style={styles.badgeIcon} 
          />
          <Text style={styles.verificationText}>
            {getVerificationStatus()}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Vehicles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Vehicles</Text>
            <TouchableOpacity onPress={navigateToAddVehicle} style={styles.addButton}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : userVehicles.length > 0 ? (
            userVehicles.map((vehicle, index) => (
              <View key={vehicle._id || index} style={styles.vehicleCard}>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>{vehicle.make} {vehicle.modelName} ({vehicle.year})</Text>
                  <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
                </View>
                <View style={[
                  styles.verificationBadge, 
                  vehicle.verificationStatus === 'verified' ? styles.verifiedBadge : styles.pendingBadge
                ]}>
                  <Ionicons 
                    name={vehicle.verificationStatus === 'verified' ? "checkmark-circle" : "time"} 
                    size={14} 
                    color="#fff" 
                  />
                  <Text style={styles.verificationText}>
                    {vehicle.verificationStatus === 'verified' ? 'Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noVehiclesContainer}>
              <Text style={styles.noVehiclesText}>No vehicles added yet</Text>
              <Button 
                mode="contained" 
                onPress={navigateToAddVehicle}
                style={styles.addVehicleButton}
                icon="plus"
              >
                Add Vehicle
              </Button>
            </View>
          )}
        </View>

        {/* Account Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>{user?.email || 'No email'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="phone-portrait-outline" size={20} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>{user?.phone || 'No phone number'}</Text>
          </View>
        </View>

        {/* Verification Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateToVerification('user')}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons 
                name={user?.verification?.documents ? "checkmark-circle" : "alert-circle"} 
                size={24} 
                color={user?.verification?.documents ? "#4CAF50" : "#FFA000"} 
              />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>
                {user?.verification?.documents ? 'Identity Verified' : 'Verify Identity'}
              </Text>
              <Text style={styles.menuSubtext}>
                {user?.verification?.documents ? 
                  'Documents submitted' : 
                  'Upload ID and address proof'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rides</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="car-outline" size={24} color="#333" />
            <Text style={styles.menuText}>My Rides</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Admin Panel Section - Only visible to admin users */}
        {user?.isAdmin && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                // @ts-ignore - navigation type issue
                navigation.navigate('Admin', { screen: 'AdminDashboard' });
              }}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="shield-outline" size={24} color="#007AFF" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuText}>Admin Panel</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#ff4444" />
            <Text style={[styles.menuText, { color: '#ff4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  // menuItem style moved to Menu Item section below
  card: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoIcon: {
    marginRight: 15,
    width: 24,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  // logoutButton style moved to Menu Item section below
  noVehiclesContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noVehiclesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  addVehicleButton: {
    width: '100%',
    backgroundColor: '#007AFF',
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666',
  },
  
  // Profile Header
  profileHeader: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Content
  content: {
    flex: 1,
    padding: 15,
  },
  
  // Section
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  // Buttons
  addButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Loading
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  
  // Info Item
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  // Menu Container
  menuContainer: {
    flex: 1,
    padding: 15,
  },
  
  // Menu Item - Consolidated menuItem style
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  menuText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  // Logout button style - consolidated
  logoutButton: {
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 160, 0, 0.9)',
  },
  verificationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  badgeIcon: {
    marginRight: 4,
  },
});

export default ProfileScreen;
