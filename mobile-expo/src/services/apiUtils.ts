import { ApiError } from '../types/api';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// API request configuration type
export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  params?: any;
  headers?: any;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

// Error handling utilities
export const handleApiError = (error: any): ApiError => {
  const apiError: ApiError = {
    status: error.response?.status || 500,
    message: error.response?.data?.message || error.message || 'An error occurred',
    details: error.response?.data?.details,
  };

  // Handle specific error cases
  switch (apiError.status) {
    case 401:
      // Handle unauthorized
      Alert.alert('Session Expired', 'Please log in again');
      useAuthStore.getState().logout();
      break;
    case 403:
      // Handle forbidden
      Alert.alert('Access Denied', 'You dont have permission to access this resource');
      break;
    case 404:
      // Handle not found
      Alert.alert('Not Found', 'The requested resource could not be found');
      break;
    default:
      // Handle other errors
      Alert.alert('Error', apiError.message);
  }

  return apiError;
};

// Retry utility
export const withRetry = async <T>(
  request: () => Promise<T>,
  config: { retryCount?: number; retryDelay?: number }
): Promise<T> => {
  const { retryCount = 3, retryDelay = 1000 } = config;
  let attempts = 0;

  while (attempts < retryCount) {
    try {
      return await request();
    } catch (error: any) {
      if (attempts === retryCount - 1) {
        throw error;
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
    }
  }
  throw new Error('Request failed after all retries');
};

// Caching utilities
export const withCache = async <T>(
  request: () => Promise<T>,
  cacheKey: string,
  cacheDuration: number = 60 * 60 * 1000 // 1 hour default
): Promise<T> => {
  try {
    // Try to get from cache
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < cacheDuration) {
        return data;
      }
    }

    // If not in cache or expired, make request
    const response = await request();
    
    // Cache the response
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({
        data: response,
        timestamp: Date.now()
      })
    );

    return response;
  } catch (error) {
    // If cache retrieval fails, still return fresh data
    return request();
  }
};

// Pagination utilities
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const fetchPaginated = async <T>(
  request: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>,
  initialPage: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<T>> => {
  try {
    const response = await request(initialPage, pageSize);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Location utilities
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const fetchNearby = async <T>(
  request: (coords: Coordinates, radius: number) => Promise<T>,
  coordinates: Coordinates,
  radius: number = 10000 // 10km default radius
): Promise<T> => {
  try {
    return await request(coordinates, radius);
  } catch (error) {
    throw handleApiError(error);
  }
};

// GNews API specific utilities
export interface GNewsResponse {
  status: string;
  totalArticles: number;
  articles: any[];
  nextPage?: number;
}

// Get GNews API key from environment
const getGNewsApiKey = (): string => {
  if (process.env.EXPO_PUBLIC_GNEWS_API_KEY) {
    return process.env.EXPO_PUBLIC_GNEWS_API_KEY;
  }

  // Try loading from .env file
  try {
    const fs = require('expo-file-system');
    const envPath = fs.documentDirectory + '.env';
    const envContent = fs.readAsStringAsync(envPath);
    const envVars = envContent.split('\n').reduce((acc: Record<string, string>, line: string) => {
      const [key, value] = line.split('=');
      if (key && value) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {});
    if (envVars.EXPO_PUBLIC_GNEWS_API_KEY) {
      return envVars.EXPO_PUBLIC_GNEWS_API_KEY;
    }
  } catch (error) {
    console.error('Error reading .env file:', error);
  }

  throw new Error('GNews API key not configured');
};

export const fetchGNews = async (params: {
  q: string;
  lang?: string;
  max?: number;
  page?: number;
}): Promise<GNewsResponse> => {
  try {
    const apiKey = getGNewsApiKey();
    const response = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(params.q)}&lang=${params.lang || 'en'}&max=${params.max || 10}&page=${params.page || 1}&token=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GNews API error: ${errorData.message || response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('GNews API error:', error);
    throw new Error('Failed to fetch news articles');
  }
};

// Rate limiting handler for GNews API
export const withRateLimit = async <T>(
  request: () => Promise<T>,
  config: {
    maxRequestsPerDay?: number;
    resetTime?: number;
  }
): Promise<T> => {
  const { maxRequestsPerDay = 100, resetTime = 86400000 } = config;
  const now = new Date();

  // Check if we need to reset the counter
  const lastReset = await AsyncStorage.getItem('gnews_last_reset');
  const requestCount = await AsyncStorage.getItem('gnews_request_count');

  if (!lastReset || !requestCount) {
    await AsyncStorage.setItem('gnews_request_count', '0');
    await AsyncStorage.setItem('gnews_last_reset', now.toISOString());
  } else {
    const resetDate = new Date(lastReset);
    const timeDiff = now.getTime() - resetDate.getTime();
    
    if (timeDiff >= resetTime) {
      await AsyncStorage.setItem('gnews_request_count', '0');
      await AsyncStorage.setItem('gnews_last_reset', now.toISOString());
    }
  }

  // Get current request count
  const currentCount = parseInt(await AsyncStorage.getItem('gnews_request_count') || '0', 10);
  
  // Check if we've exceeded the limit
  if (currentCount >= maxRequestsPerDay) {
    throw new Error('Daily API request limit exceeded');
  }

  try {
    const result = await request();
    await AsyncStorage.setItem('gnews_request_count', (currentCount + 1).toString());
    return result;
  } catch (error) {
    throw error;
  }
};

// Export common request methods
export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  error?: ApiError;
  message: string;
}

export async function apiRequest<T>(
  config: ApiRequestConfig
): Promise<ApiResponse<T>> {
  try {
    if (!api) {
      throw new Error('API client is not initialized');
    }
    const response = await withRetry(
      () => (api as any).request({
        ...config,
        headers: {
          ...config.headers,
          Accept: 'application/json',
        },
      }),
      { retryCount: 3, retryDelay: 1000 }
    );
    const safeResponse = response as { data?: T };
    return {
      data: safeResponse.data ?? null,
      success: true,
      message: 'Success',
    };
  } catch (error) {
    const apiError = handleApiError(error);
    return {
      data: null,
      success: false,
      error: apiError,
      message: apiError.message,
    };
  }
};
