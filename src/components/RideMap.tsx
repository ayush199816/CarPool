import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, ViewStyle, StyleProp, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { Ride } from '../types/ride';
import { featureFlags } from '../constants/theme';
import WebView from 'react-native-webview';

// Define Coordinates type since it's not directly exported from react-native-maps
interface Coordinates {
  latitude: number;
  longitude: number;
}

// Fallback coordinates (center of India)
const FALLBACK_COORDS = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

interface RideMapProps {
  ride: Pick<Ride, 'startPoint' | 'endPoint' | 'startPointCoords' | 'endPointCoords'>;
  height?: number;
  width?: number;
  style?: StyleProp<ViewStyle>;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_REGION = {
  latitude: 20.5937, // Center of India
  longitude: 78.9629,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

const RideMap: React.FC<RideMapProps> = ({
  ride,
  height = 200,
  width = SCREEN_WIDTH - 32, // Default to screen width with some padding
  style
}) => {
  const [origin, setOrigin] = useState<Coordinates | null>(ride.startPointCoords || null);
  const [destination, setDestination] = useState<Coordinates | null>(ride.endPointCoords || null);
  const [loading, setLoading] = useState(!ride.startPointCoords || !ride.endPointCoords);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<WebView>(null);

  useEffect(() => {
    const geocodeLocations = async () => {
      if (origin && destination) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Geocode start point if needed
        if (!origin && ride.startPoint) {
          const startLocation = await Location.geocodeAsync(ride.startPoint);
          
          if (startLocation.length > 0) {
            setOrigin({
              latitude: startLocation[0].latitude,
              longitude: startLocation[0].longitude
            });
          } else {
            console.warn('No coordinates found for start point:', ride.startPoint);
          }
        }

        // Geocode end point if needed
        if (!destination && ride.endPoint) {
          const endLocation = await Location.geocodeAsync(ride.endPoint);
          
          if (endLocation.length > 0) {
            setDestination({
              latitude: endLocation[0].latitude,
              longitude: endLocation[0].longitude
            });
          } else {
            console.warn('No coordinates found for end point:', ride.endPoint);
          }
        }
      } catch (err) {
        console.error('Error geocoding locations:', err);
        setError('Could not determine route. Please check your connection and location permissions.');
      } finally {
        setLoading(false);
      }
    };

    geocodeLocations();
  }, [ride.startPoint, ride.endPoint]);

  const leafletHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      (function () {
        var map = L.map('map', { zoomControl: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var originMarker = null;
        var destMarker = null;
        var routeLine = null;

        window.__setRoute = function(oLat, oLng, dLat, dLng) {
          try {
            var origin = [oLat, oLng];
            var dest = [dLat, dLng];

            if (originMarker) { originMarker.setLatLng(origin); }
            else { originMarker = L.marker(origin).addTo(map); }

            if (destMarker) { destMarker.setLatLng(dest); }
            else { destMarker = L.marker(dest).addTo(map); }

            if (routeLine) { routeLine.setLatLngs([origin, dest]); }
            else {
              routeLine = L.polyline([origin, dest], {
                color: '${colors.primary}',
                weight: 3,
                dashArray: '5,5'
              }).addTo(map);
            }

            var bounds = L.latLngBounds([origin, dest]);
            map.fitBounds(bounds, { padding: [30, 30] });
          } catch (e) {}
        };

        map.setView([${DEFAULT_REGION.latitude}, ${DEFAULT_REGION.longitude}], 5);
      })();
    </script>
  </body>
</html>`;
  }, []);

  useEffect(() => {
    if (!featureFlags.showMaps) return;
    if (!origin || !destination) return;
    if (!mapRef.current) return;

    mapRef.current.injectJavaScript(
      `if (window.__setRoute) { window.__setRoute(${origin.latitude}, ${origin.longitude}, ${destination.latitude}, ${destination.longitude}); } true;`
    );
  }, [origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]);

  // Calculate region to show both points
  const getMapRegion = () => {
    if (!origin || !destination) return DEFAULT_REGION;
    
    // Calculate the min/max coordinates to fit both points
    const minLat = Math.min(origin.latitude, destination.latitude);
    const maxLat = Math.max(origin.latitude, destination.latitude);
    const minLng = Math.min(origin.longitude, destination.longitude);
    const maxLng = Math.max(origin.longitude, destination.longitude);
    
    // Add some padding
    const padding = 0.1;
    const latDelta = (maxLat - minLat) + padding;
    const lngDelta = (maxLng - minLng) + padding;
    
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { height, width }]}>
        <View style={styles.placeholder}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.placeholderText, { marginTop: 10 }]}>
            Loading map...
          </Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, { height, width }]}>
        <View style={styles.placeholder}>
          <Ionicons name="warning" size={32} color={colors.warning} />
          <Text style={[styles.placeholderText, { marginTop: 10 }]}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  // If we still don't have coordinates after trying to geocode
  if (!origin || !destination) {
    return (
      <View style={[styles.container, { height, width }]}>
        <View style={styles.placeholder}>
          <Ionicons name="map-outline" size={32} color={colors.textSecondary} />
          <Text style={[styles.placeholderText, { marginTop: 10 }]}>
            Could not determine route. Please check the addresses.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height, width }, style]}>
      {featureFlags.showMaps ? (
        <WebView
          ref={mapRef}
          originWhitelist={['*']}
          source={{ html: leafletHtml }}
        />
      ) : (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={32} color={colors.textSecondary} />
          <Text style={styles.placeholderText}>Maps are temporarily disabled</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 200,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  placeholderText: {
    marginTop: 8,
    color: colors.text,
  },
  marker: {
    backgroundColor: colors.white,
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default RideMap;
