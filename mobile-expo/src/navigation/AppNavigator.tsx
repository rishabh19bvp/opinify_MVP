import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import { colors } from '../utils/theme';
import type { User } from 'firebase/auth';

// Define the root stack parameter list
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const { user, checkAuthStatus } = useAuthStore();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        setInitializing(false);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setInitializing(false);
      }
    };
    
    checkAuth();
  }, [checkAuthStatus]);

  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{
              gestureEnabled: false,
              presentation: 'modal'
            }}
          />
        ) : (
          <Stack.Screen 
            name="Main" 
            component={TabNavigator}
            options={{
              gestureEnabled: false,
              presentation: 'modal'
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default AppNavigator;
