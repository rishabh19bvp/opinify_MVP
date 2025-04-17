import { create } from 'zustand';
import * as Location from 'expo-location';

interface LocationState {
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<void>;
  clearError: () => void;
}

type LocationError = Error | { message?: string };

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  isLoading: false,
  error: null,
  hasPermission: false,

  requestLocationPermission: async () => {
    set({ isLoading: true, error: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      
      set({ hasPermission, isLoading: false });
      return hasPermission;
    } catch (error: unknown) {
      const locationError = error as LocationError;
      set({
        error: locationError.message || 'Failed to request location permission',
        isLoading: false,
        hasPermission: false,
      });
      return false;
    }
  },

  getCurrentLocation: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Check if we have permission
      const hasPermission = await useLocationStore.getState().requestLocationPermission();
      
      if (!hasPermission) {
        set({
          error: 'Location permission not granted',
          isLoading: false,
        });
        return;
      }
      
      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      set({
        currentLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        isLoading: false,
      });
    } catch (error: unknown) {
      const locationError = error as LocationError;
      set({
        error: locationError.message || 'Failed to get current location',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
