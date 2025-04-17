import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationState {
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  error: string | null;
  isReady: boolean;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationState>({
    coordinates: null,
    error: null,
    isReady: false,
  });

  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation({
            coordinates: null,
            error: 'Permission to access location was denied',
            isReady: true,
          });
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLocation({
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          error: null,
          isReady: true,
        });
      } catch (error) {
        setLocation({
          coordinates: null,
          error: 'Failed to get location',
          isReady: true,
        });
      }
    };

    getLocation();
  }, []);

  return location;
};
