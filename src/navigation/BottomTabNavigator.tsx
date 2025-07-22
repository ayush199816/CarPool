import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import RideListScreen from '../screens/RideListScreen';
import AddRideScreen from '../screens/AddRideScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserRidesScreen from '../screens/UserRidesScreen';
import { colors } from '../constants/theme';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
};

type TabBarIconFunction = (props: TabBarIconProps) => React.ReactNode;

const Tab = createBottomTabNavigator<MainTabParamList>();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }: { route: RouteProp<Record<string, object | undefined>, string> }) => ({
        tabBarIcon: ({ focused, color, size }: TabBarIconProps) => {
          let iconName: string = 'home';

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'RideList') {
            iconName = 'car';
          } else if (route.name === 'AddRide') {
            iconName = 'add-circle';
          } else if (route.name === 'UserRides') {
            iconName = 'list';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          paddingVertical: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="RideList" 
        component={RideListScreen} 
        options={{
          title: 'Rides',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="AddRide" 
        component={AddRideScreen} 
        options={{
          title: 'Add Ride',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="UserRides" 
        component={UserRidesScreen} 
        options={{
          title: 'My Rides',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
