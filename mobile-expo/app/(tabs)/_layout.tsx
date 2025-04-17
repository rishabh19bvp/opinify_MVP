import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors } from '../../src/utils/theme';

export default function TabsLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { logout } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await useAuthStore.getState().checkAuthStatus();
      setIsAuthenticated(authStatus);
    };
    checkAuth();
  }, []);

  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)'); // Redirect to auth when not authenticated
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  logoutButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
