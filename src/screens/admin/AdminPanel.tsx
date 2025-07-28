import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { SCREENS, ADMIN_SCREENS } from '../../navigation/types';
import { getStats } from '../../services/adminService';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingVerifications: number;
  totalRides: number;
}

const AdminPanel = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingVerifications: 0,
    totalRides: 0,
  });

  // Check if the current user is an admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      // If not an admin, redirect to home
      // @ts-ignore - Navigation type will be resolved at runtime
      navigation.navigate('MainTabs', { screen: 'Home' });
    }
  }, [user, navigation]);

  // Mock function to load admin stats
  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const statsData = await getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate(SCREENS.LOGIN as never);
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const navigateToScreen = (screen: keyof typeof ADMIN_SCREENS) => {
    // @ts-ignore - Navigation type will be resolved at runtime
    navigation.navigate(screen);
  };

  if (!user?.isAdmin) {
    return (
      <View style={styles.container}>
        <Text>Unauthorized Access</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.activeUsers}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingVerifications}</Text>
          <Text style={styles.statLabel}>Pending Verifications</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalRides}</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigateToScreen('AdminUsers')}
          >
            <Text style={styles.actionText}>Manage Users</Text>
            <Text style={styles.actionSubtext}>{stats.totalUsers} total users</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigateToScreen('AdminVehicleApprovals')}
          >
            <Text style={styles.actionText}>Vehicle Approvals</Text>
            <Text style={styles.actionSubtext}>{stats.pendingVerifications} pending</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#ff4444',
    borderRadius: 4,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    fontSize: 14,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
});

export default AdminPanel;
