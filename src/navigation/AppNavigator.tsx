import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);

  // Add a small delay to ensure everything is loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppIsReady(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading indicator only if we're still loading the auth state
  // and the app isn't ready yet
  if (isLoading && !appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If we're done loading but there's no user, show AuthStack
  // If there is a user, show AppStack
  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default AppNavigator;
