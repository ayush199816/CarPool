import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { SCREENS } from '../../navigation/types';
import { getUserList, updateUser, deleteUser } from '../../services/adminService';
import { User } from '../../types/user';

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user: currentUser } = useAuth();
  const navigation = useNavigation();

  const loadUsers = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);
      
      const userList = await getUserList();
      // Filter out the current admin user from the list
      const filteredUsers = userList.filter(u => u._id !== currentUser?._id);
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      Alert.alert(
        'Update User',
        `Are you sure you want to ${currentStatus ? 'remove' : 'grant'} admin privileges for this user?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              await updateUser(userId, { isAdmin: !currentStatus });
              // Update local state
              setUsers(users.map(u => 
                u._id === userId ? { ...u, isAdmin: !currentStatus } : u
              ));
              Alert.alert('Success', 'User updated successfully');
            },
          },
        ]
      );
    } catch (err) {
      console.error('Error updating user:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      if (userId === currentUser?._id) {
        Alert.alert('Error', 'You cannot delete your own account');
        return;
      }
      
      Alert.alert(
        'Confirm Delete',
        `Are you sure you want to delete ${userName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteUser(userId);
              loadUsers();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'Failed to delete user. Please try again.');
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.phone && <Text style={styles.userDetail}>Phone: {item.phone}</Text>}
        <Text style={styles.userDetail}>
          Joined: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
        </Text>
        <View style={[styles.adminBadge, !item.isAdmin && styles.hidden]}>
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.toggleButton, item.isAdmin && styles.removeAdminButton]}
          onPress={() => toggleAdminStatus(item._id, !!item.isAdmin)}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>
            {item.isAdmin ? 'Remove Admin' : 'Make Admin'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item._id, item.name)}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Users</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>No users found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#4a90e2',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});

export default UsersManagement;
