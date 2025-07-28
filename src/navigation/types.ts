import { Ride } from '../types/ride';
import { StackNavigationOptions, HeaderStyleInterpolators, StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp, NavigatorScreenParams, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Main Tab Navigator Screens
export type MainTabParamList = {
  Home: undefined;
  RideList: undefined;
  AddRide: undefined;
  UserRides: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  // Main Tabs
  MainTabs: undefined;
  
  // Modal/Fullscreen Screens
  RideDetails: { rideId: string };
  EditRide: { ride: Ride };
  
  // Verification
  Verification: { type: 'user' | 'vehicle' };
  
  // Vehicle Management
  AddVehicle: undefined;
  VehicleList: undefined;
};

// Define the root stack param list with all possible screens
export type RootStackParamList = {
  // Auth Screens
  Login: undefined;
  Register: undefined;
  
  // Main Tabs
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  
  // Modal/Fullscreen Screens
  RideDetails: { rideId: string };
  EditRide: { ride: Ride };
  
  // Individual Screens
  RideList: undefined;
  AddRide: undefined;
  Profile: undefined;
  Home: undefined;
  MyBookings: undefined;
  MyRides: undefined;
  Verification: { type: 'user' | 'vehicle' };
  
  // Alias for Verification to match AppStackParamList
  [SCREENS.VERIFICATION]: { type: 'user' | 'vehicle' };
};

// Define navigation prop types for type safety
export type MainTabsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  StackNavigationProp<RootStackParamList>
>;

export type MainTabsRouteProp = RouteProp<RootStackParamList, 'MainTabs'>;

// Screen names
export const SCREENS = {
  // Auth Screens
  LOGIN: 'Login',
  REGISTER: 'Register',
  
  // Main Tabs
  HOME: 'Home',
  RIDE_LIST: 'RideList',
  ADD_RIDE: 'AddRide',
  MY_BOOKINGS: 'MyBookings',
  PROFILE: 'Profile',
  
  // Modal/Fullscreen Screens
  RIDE_DETAILS: 'RideDetails',
  EDIT_RIDE: 'EditRide',
  VERIFICATION: 'Verification',
  
  // Vehicle Management
  ADD_VEHICLE: 'AddVehicle',
  VEHICLE_LIST: 'VehicleList',
} as const;

// Common navigation options
export const commonHeaderOptions: StackNavigationOptions = {
  headerStyle: {
    backgroundColor: '#007AFF',
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: '600' as const,
  },
  headerBackTitle: 'Back',
  headerBackTitleStyle: {
    fontSize: 14,
  },
  headerTitleAlign: 'center',
  headerTitleContainerStyle: {
    left: 0,
    right: 0,
  },
  headerLeftContainerStyle: {
    paddingLeft: 8,
  },
  headerRightContainerStyle: {
    paddingRight: 8,
  },
  cardStyle: {
    backgroundColor: '#fff',
  },
  animationTypeForReplace: 'push',
  gestureEnabled: true,
  headerBackAccessibilityLabel: 'Back',
  headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
};
