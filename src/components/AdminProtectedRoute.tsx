import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { SCREENS } from '../navigation/types';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // If not logged in, redirect to login
        navigation.reset({
          index: 0,
          routes: [{ name: SCREENS.LOGIN }],
        });
      } else if (!user.isAdmin) {
        // If not an admin, redirect to home
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
        });
      }
    }
  }, [user, isLoading, navigation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // If user is authenticated and is an admin, render children
  if (user?.isAdmin) {
    return <>{children}</>;
  }

  // Otherwise, show nothing (will be redirected by the effect)
  return null;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default AdminProtectedRoute;
