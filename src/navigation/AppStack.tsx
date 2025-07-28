import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SCREENS, commonHeaderOptions, ADMIN_SCREENS } from './types';
import { AppStackParamList } from './types';

// Screens
import RideDetailsScreen from '../screens/RideDetailsScreen';
import EditRideScreen from '../screens/EditRideScreen';
import BottomTabNavigator from './BottomTabNavigator';
import VerificationScreen from '../screens/verification/VerificationScreen';
import AddVehicleScreen from '../screens/vehicles/AddVehicleScreen';
import AdminStack from './AdminStack';

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
      <Stack.Screen 
        name="AddVehicle"
        component={AddVehicleScreen} 
        options={{ title: 'Add Vehicle' }}
      />
      <Stack.Screen 
        name="Admin"
        component={AdminStack}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Add this to fix the navigation type issue
declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList {}
  }
}

export default AppStack;
