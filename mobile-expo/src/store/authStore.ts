import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../types/auth';
import { initApi } from '../services/api';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  updateUser: (user: AuthUser | null, token: string | null) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  getToken: () => Promise<string | null>;
  checkAuthStatus: () => Promise<boolean>;
}



export const useAuthStore = create<AuthState>((set, get) => ({
  // State
  user: null,
  token: null,
  isLoading: false,
  error: null,

  // Actions
  updateUser: async (user, token) => {
    try {
      set({ user, token });
      if (token) {
        await AsyncStorage.setItem('auth_token', token);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      set({ error: 'Failed to update user' });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      // Initialize API with the correct base URL
      const apiInstance = await initApi('http://192.168.1.64:63215');
      const response = await apiInstance.post('/api/auth/login', { email, password });
      
      const { token, user } = response.data;
      if (token && user) {
        const authUser: AuthUser = {
          id: user.id,
          email: user.email,
          username: user.username
        };
        
        await set({
          user: authUser,
          token,
          error: null,
          isLoading: false,
        });
        await AsyncStorage.setItem('auth_token', token);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to login';
      set({ error: errorMessage, isLoading: false });
    }
  },

  register: async (email: string, password: string, username: string) => {
    try {
      set({ isLoading: true, error: null });
      // Initialize API with the correct base URL
      const apiInstance = await initApi('http://192.168.1.64:63215');
      const response = await apiInstance.post('/api/auth/register', { email, password, username });
      
      const { token, user } = response.data;
      if (token && user) {
        const authUser: AuthUser = {
          id: user.id,
          email: user.email,
          username: user.username
        };
        
        await set({
          user: authUser,
          token,
          isLoading: false,
          error: null,
        });
        await AsyncStorage.setItem('auth_token', token);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to register';
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      set({
        user: null,
        token: null,
        error: null,
        isLoading: false
      });
      return Promise.resolve();
    } catch (error: any) {
      console.error('Logout error:', error);
      set({ error: error.message || 'Failed to logout' });
      return Promise.reject(error);
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      // Initialize API with the correct base URL
      const apiInstance = await initApi('http://192.168.1.64:63215');
      const response = await apiInstance.post('/api/auth/reset-password', { email });
      set({ isLoading: false, error: null });
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to reset password';
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  getToken: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  checkAuthStatus: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        set({ user: null, token: null });
        return false;
      }

      // Verify the token with the backend
      try {
        const apiInstance = await initApi('http://192.168.1.64:63215');
        const response = await apiInstance.get('/api/auth/me');
        if (response.data.success && response.data.user) {
          const authUser: AuthUser = {
            id: response.data.user._id,
            email: response.data.user.email,
            username: response.data.user.username
          };
          set({ user: authUser, token });
          return true;
        } else {
          await AsyncStorage.removeItem('auth_token');
          set({ user: null, token: null });
          return false;
        }
      } catch (error: any) {
        console.error('Token verification failed:', error);
        await AsyncStorage.removeItem('auth_token');
        set({ user: null, token: null });
        return false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      set({ user: null, token: null });
      return false;
    }
  },
}));
