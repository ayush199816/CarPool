import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ADMIN_SCREENS, commonHeaderOptions } from './types';
import { AdminStackParamList } from './types';
import AdminProtectedRoute from '../components/AdminProtectedRoute';

// Admin Screens
import AdminPanel from '../screens/admin/AdminPanel';
import UsersManagement from '../screens/admin/UsersManagement';
import VehicleApproval from '../screens/admin/VehicleApproval';

const Stack = createStackNavigator<AdminStackParamList>();

const AdminStack = () => {
  const ProtectedScreen = (Component: React.ComponentType) => {
    return () => (
      <AdminProtectedRoute>
        <Component />
      </AdminProtectedRoute>
    );
  };

  return (
    <Stack.Navigator
      screenOptions={{
        ...commonHeaderOptions,
      }}
    >
      <Stack.Screen 
        name="AdminDashboard" 
        component={ProtectedScreen(AdminPanel)}
        options={{ title: 'Admin Dashboard' }}
      />
      <Stack.Screen 
        name="AdminUsers" 
        component={ProtectedScreen(UsersManagement)}
        options={{ title: 'Manage Users' }}
      />
      <Stack.Screen 
        name="AdminVehicleApprovals" 
        component={ProtectedScreen(VehicleApproval)}
        options={{ title: 'Vehicle Approvals' }}
      />

    </Stack.Navigator>
  );
};

export default AdminStack;
