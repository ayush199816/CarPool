import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import SplashScreen from '../screens/SplashScreen';

const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Handle splash screen timeout
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // Show splash for 3 seconds

    // Add a small delay to ensure everything is loaded
    const appReadyTimer = setTimeout(() => {
      setAppIsReady(true);
    }, 1000);
    
    return () => {
      clearTimeout(splashTimer);
      clearTimeout(appReadyTimer);
    };
  }, []);

  // Show splash screen first
  if (showSplash) {
    return (
      <SplashScreen onAnimationComplete={() => setShowSplash(false)} />
    );
  }

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
