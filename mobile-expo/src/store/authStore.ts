import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../types/auth';
import { initApi } from '../services/api';
import Constants from 'expo-constants';
import { loginUser, registerUser, resetPassword as firebaseResetPassword } from '../services/firebaseAuth';
import { updateProfile } from 'firebase/auth';

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
      // Use Firebase Auth
      const user = await loginUser(email, password);
      const token = await user.getIdToken();
      const authUser: AuthUser = {
        id: user.uid,
        email: user.email ?? '',
        username: user.displayName ?? '',
        profile: {},
        pollsVoted: 0,
        groupsCount: 0,
      };
      await set({
        user: authUser,
        token,
        error: null,
        isLoading: false,
      });
      await AsyncStorage.setItem('auth_token', token);
    } catch (error: any) {
      console.error('Login error:', error);
      set({ error: error.message || 'Failed to login', isLoading: false });
    }
  },

  register: async (email: string, password: string, username: string) => {
    try {
      set({ isLoading: true, error: null });
      // Use Firebase Auth
      const user = await registerUser(email, password);
      // Optionally, update displayName (username)
      if (user) {
        await updateProfile(user, { displayName: username });
      }
      const token = await user.getIdToken();
      const authUser: AuthUser = {
        id: user.uid,
        email: user.email ?? '',
        username: username ?? '',
        profile: {},
        pollsVoted: 0,
        groupsCount: 0,
      };
      await set({
        user: authUser,
        token,
        isLoading: false,
        error: null,
      });
      await AsyncStorage.setItem('auth_token', token);
    } catch (error: any) {
      console.error('Registration error:', error);
      set({
        error: error.message || 'Failed to register',
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
      // IMPORTANT: Do not make any authenticated API calls after this point
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
      await firebaseResetPassword(email);
      set({ isLoading: false, error: null });
    } catch (error: any) {
      console.error('Password reset error:', error);
      set({ error: error.message || 'Failed to reset password', isLoading: false });
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
        const apiBaseUrl = Constants.expoConfig?.extra?.API_BASE_URL || 
          process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
        if (!apiBaseUrl) throw new Error('API base URL not configured');
        const apiInstance = await initApi(apiBaseUrl);
        apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await apiInstance.get('/api/auth/me');
        if (response.data.success && response.data.user) {
          const u = response.data.user;
          const authUser: AuthUser = {
            id: u._id,
            email: u.email,
            username: u.username,
            profile: u.profile,
            pollsVoted: u.pollsVoted,
            groupsCount: u.groupsCount
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
