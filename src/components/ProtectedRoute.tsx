import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { SCREENS, RootStackParamList } from '../navigation/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigation = useNavigation();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Wait for navigation to be ready before using it
  useEffect(() => {
    // @ts-ignore - navigation.isReady is not in the type definition but exists in the runtime
    const unsubscribe = navigation.addListener('state', () => {
      // @ts-ignore
      if (navigation.isReady()) {
        setIsNavigationReady(true);
      }
    });

    // @ts-ignore
    if (navigation.isReady()) {
      setIsNavigationReady(true);
    }

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // Only try to navigate if navigation is ready and we're not loading
    if (isNavigationReady && !isLoading && !user) {
      const nav = navigation as unknown as StackNavigationProp<ParamListBase>;
      nav.reset({
        index: 0,
        routes: [{ name: SCREENS.LOGIN }],
      });
    }
  }, [user, isLoading, navigation, isNavigationReady]);

  // Show loading indicator while checking auth state or waiting for navigation
  if (isLoading || !isNavigationReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If not authenticated, don't render anything (navigation effect will handle redirect)
  if (!user) {
    return null;
  }

  // If authenticated, render the protected component
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default ProtectedRoute;
