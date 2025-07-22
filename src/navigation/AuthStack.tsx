import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SCREENS, commonHeaderOptions } from './types';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import { AuthStackParamList } from './types';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        ...commonHeaderOptions,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen 
        name={SCREENS.LOGIN} 
        component={LoginScreen} 
        options={{ 
          title: 'Sign In',
          headerShown: false, // Hide header for login screen
        }}
      />
      <Stack.Screen 
        name={SCREENS.REGISTER} 
        component={RegisterScreen} 
        options={({ navigation }) => ({
          title: 'Create Account',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  backButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 16,
  },
});

export default AuthStack;
