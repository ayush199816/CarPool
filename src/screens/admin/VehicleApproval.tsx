import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getPendingVerifications, updateVerificationStatus } from '../../services/verificationService';
import { VehicleVerification } from '../../services/verificationService';
import { API_URL } from '../../Config';

const VehicleApproval = () => {
  const [verifications, setVerifications] = useState<VehicleVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const loadVerifications = async () => {
    try {
      setIsLoading(true);
      const data = await getPendingVerifications();
      setVerifications(data);
      setError(null);
    } catch (err) {
      setError('Failed to load verification requests');
      console.error('Error loading verifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (verificationId: string, status: 'verified' | 'rejected') => {
    try {
      const action = status === 'verified' ? 'verify' : 'reject';
      
      Alert.alert(
        `${status === 'verified' ? 'Verify' : 'Reject'} Vehicle`,
        `Are you sure you want to ${action} this vehicle verification?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: status === 'verified' ? 'Verify' : 'Reject',
            style: status === 'verified' ? 'default' : 'destructive',
            onPress: async () => {
              await updateVerificationStatus(verificationId, status);
              setVerifications(verifications.map(v => 
                v._id === verificationId ? { ...v, status } : v
              ));
              Alert.alert('Success', `Verification ${status} successfully`);
            },
          },
        ]
      );
    } catch (err) {
      console.error(`Error ${status}ing verification:`, err);
      Alert.alert('Error', `Failed to ${status} verification. Please try again.`);
    }
  };

  const renderVerificationItem = ({ item }: { item: VehicleVerification }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.userName}>{item.user.name}</Text>
        <Text style={styles.userEmail}>{item.user.email}</Text>
      </View>
      
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleTitle}>Vehicle Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Make:</Text>
          <Text style={styles.detailValue}>{item.vehicle.make}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Model:</Text>
          <Text style={styles.detailValue}>{item.vehicle.model}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Year:</Text>
          <Text style={styles.detailValue}>{item.vehicle.year}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>License Plate:</Text>
          <Text style={styles.detailValue}>{item.vehicle.licensePlate}</Text>
        </View>
      </View>
      
      <View style={styles.documentSection}>
        <Text style={styles.sectionTitle}>Verification Document</Text>
        <Image 
          source={{ uri: `${API_URL}/${item.documentUrl}` }} 
          style={styles.documentImage}
          resizeMode="contain"
          onError={(e) => console.log('Error loading image:', e.nativeEvent.error)}
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.dateText}>
          Submitted: {new Date(item.createdAt).toLocaleString()}
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleStatusUpdate(item._id, 'rejected')}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => handleStatusUpdate(item._id, 'verified')}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVerifications();
    setRefreshing(false);
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text>Loading verification requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicle Verification Requests</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <FlatList
        data={verifications}
        renderItem={renderVerificationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>No pending verification requests</Text>
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
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
  documentSection: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
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
  verificationCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  verificationHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  vehicleInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  documentContainer: {
    marginBottom: 16,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#555',
  },
  documentImage: {
    width: '100%',
    height: 200,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#2ecc71',
  },
  rejectButton: {
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
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 4,
    marginBottom: 16,
  },
});

export default VehicleApproval;
