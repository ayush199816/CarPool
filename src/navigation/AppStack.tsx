import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SCREENS, commonHeaderOptions } from './types';
import { AppStackParamList } from './types';

// Screens
import RideDetailsScreen from '../screens/RideDetailsScreen';
import EditRideScreen from '../screens/EditRideScreen';
import BottomTabNavigator from './BottomTabNavigator';
import VerificationScreen from '../screens/verification/VerificationScreen';

const Stack = createStackNavigator<AppStackParamList>();

const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        ...commonHeaderOptions,
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={BottomTabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.RIDE_DETAILS} 
        component={RideDetailsScreen} 
        options={{ title: 'Ride Details' }}
      />
      <Stack.Screen 
        name={SCREENS.EDIT_RIDE} 
        component={EditRideScreen} 
        options={{ title: 'Edit Ride' }}
      />
      <Stack.Screen 
        name={SCREENS.VERIFICATION}
        component={VerificationScreen} 
        options={{ title: 'Verification' }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
