import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
import AuthNavigator from '../../src/navigation/AuthNavigator';

export default function AuthLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await useAuthStore.getState().checkAuthStatus();
      setIsAuthenticated(authStatus);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    console.log('AuthLayout: isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  return <AuthNavigator />;
}
