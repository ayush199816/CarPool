import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  // Bottom Tab Navigator
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  
  // Auth Screens
  Login: undefined;
  Register: undefined;
  
  // Main App Screens
  Home: undefined;
  RideDetails: { rideId: string };
  AddRide: undefined;
  EditRide: { rideId: string };
  MyRides: undefined;
  MyBookings: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  MyRidesTab: undefined;
  MyBookingsTab: undefined;
  ProfileTab: undefined;
};

// Extend the RootStackParamList to include all screen names
export type RootStackScreenName = keyof RootStackParamList;
