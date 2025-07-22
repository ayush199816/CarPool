import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SCREENS } from '../navigation/types';

const ProfileScreen = () => {
  const { user, logout, isUserVerified, getVerifiedVehicles } = useAuth();
  const navigation = useNavigation();
  const verifiedVehicles = getVerifiedVehicles() || [];

  const navigateToVerification = (type: 'user' | 'vehicle') => {
    // @ts-ignore - navigation type issue
    navigation.navigate(SCREENS.VERIFICATION, { type });
  };
  
  const getVerificationStatus = () => {
    if (!user?.verification) return 'Not Verified';
    return user.verification.isVerified ? 'Verified' : 'Pending Verification';
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

      <ScrollView style={styles.menuContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

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

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateToVerification('vehicle')}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons 
                name={verifiedVehicles.length > 0 ? "car-sport" : "car-sport-outline"} 
                size={24} 
                color={verifiedVehicles.length > 0 ? "#4CAF50" : "#333"} 
              />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>
                {verifiedVehicles.length > 0 ? 
                  `${verifiedVehicles.length} Vehicle${verifiedVehicles.length > 1 ? 's' : ''} Verified` : 
                  'Add Vehicle'}
              </Text>
              <Text style={styles.menuSubtext}>
                {verifiedVehicles.length > 0 ? 
                  'Tap to manage vehicles' : 
                  'Add your vehicle details'}
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
  menuContainer: {
    flex: 1,
    padding: 15,
  },
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
  sectionTitle: {
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
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
