import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Button } from 'react-native-paper';
import * as Location from 'expo-location';
import debounce from 'lodash.debounce';
import { featureFlags } from '../constants/theme';

interface MapLocationPickerProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  label: string;
}

const DEFAULT_REGION = {
  latitude: 20.5937,  // Center of India
  longitude: 78.9629,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  label,
}) => {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialLocation?.address || '');

  // Format address to show only relevant parts (city or location name)
  const formatAddress = (addressResult: Location.LocationGeocodedAddress): string => {
    // Try to get the most relevant part of the address
    const parts = [
      addressResult.name || '',
      addressResult.street || '',
      addressResult.city || '',
      addressResult.region || '',
    ].filter(part => part && part.trim() !== '');

    // If we have a name or street, use those, otherwise fall back to city/region
    if (parts.length > 0) {
      return parts[0]; // Return the most specific location part available
    }
    
    // If we have nothing else, return the full address without codes
    const fullAddress = [
      addressResult.name || '',
      addressResult.street || '',
      addressResult.city || '',
      addressResult.region || '',
    ].filter(part => part && part.trim() !== '').join(', ');

    return fullAddress || 'Selected Location';
  };

  // Set initial region if initialLocation is provided
  useEffect(() => {
    if (initialLocation) {
      setRegion({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      getCurrentLocation();
    }
  }, []);

  // Search for a location by address
  const searchLocation = useCallback(debounce(async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setIsLoading(true);
      const results = await Location.geocodeAsync(query);
      
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setRegion(newRegion);
        setAddress(query);
      } else {
        Alert.alert('Location not found', 'Please try a different address');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Error', 'Failed to search for location');
    } finally {
      setIsLoading(false);
    }
  }, 500), []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchLocation(text);
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed to find your current location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      // Get address from coordinates
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const newAddress = formatAddress(addressResult);

      setAddress(newAddress);
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      onLocationSelect({
        latitude,
        longitude,
        address: newAddress,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    
    try {
      setIsLoading(true);
      // Get address from coordinates
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const newAddress = formatAddress(addressResult);

      setAddress(newAddress);
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      onLocationSelect({
        latitude,
        longitude,
        address: newAddress,
      });
    } catch (error) {
      console.error('Error getting address:', error);
      Alert.alert('Error', 'Could not get address for selected location');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search for a location"
          placeholderTextColor="#999"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => searchLocation(searchQuery)}
        />
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
          disabled={isLoading}
        >
          <Text style={styles.currentLocationText}>📍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        {featureFlags.showMaps ? (
          <MapView
            style={styles.map}
            region={region}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
            zoomEnabled={true}
            zoomControlEnabled={true}
          >
            {region.latitude !== DEFAULT_REGION.latitude && (
              <Marker
                coordinate={{
                  latitude: region.latitude,
                  longitude: region.longitude,
                }}
                title="Selected Location"
                description={address}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.placeholderText}>Maps are temporarily disabled</Text>
          </View>
        )}
      </View>

      <Button
        mode="contained"
        onPress={() => {
          onLocationSelect({
            latitude: region.latitude,
            longitude: region.longitude,
            address,
          });
        }}
        loading={isLoading}
        style={styles.confirmButton}
      >
        Confirm Location
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  currentLocationButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  currentLocationText: {
    fontSize: 20,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    marginTop: 8,
  },
});

export default MapLocationPicker;
