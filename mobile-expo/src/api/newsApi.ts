import apiClient from './apiClient';
import { useLocationStore } from '../store/locationStore';

// News types
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  author: string;
  publishedAt: Date;
  url: string;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  category: string;
  tags: string[];
}

// News API service
const newsApi = {
  // Get news articles near the user's location
  getNearbyNews: async (radius: number = 10): Promise<NewsArticle[]> => {
    try {
      const location = useLocationStore.getState().currentLocation;
      
      if (!location) {
        throw new Error('Location not available');
      }
      
      const response = await apiClient.get<NewsArticle[]>('/news/nearby', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius,
        },
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching nearby news:', error);
      throw error;
    }
  },
  
  // Get trending news articles
  getTrendingNews: async (): Promise<NewsArticle[]> => {
    try {
      const response = await apiClient.get<NewsArticle[]>('/news/trending');
      return response;
    } catch (error) {
      console.error('Error fetching trending news:', error);
      throw error;
    }
  },
  
  // Get news articles by category
  getNewsByCategory: async (category: string): Promise<NewsArticle[]> => {
    try {
      const response = await apiClient.get<NewsArticle[]>(`/news/category/${category}`);
      return response;
    } catch (error) {
      console.error(`Error fetching news for category ${category}:`, error);
      throw error;
    }
  },
  
  // Get a specific news article by ID
  getNewsArticle: async (articleId: string): Promise<NewsArticle> => {
    try {
      const response = await apiClient.get<NewsArticle>(`/news/${articleId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching news article ${articleId}:`, error);
      throw error;
    }
  },
  
  // Search for news articles
  searchNews: async (query: string): Promise<NewsArticle[]> => {
    try {
      const response = await apiClient.get<NewsArticle[]>('/news/search', {
        params: { query },
      });
      
      return response;
    } catch (error) {
      console.error(`Error searching news with query "${query}":`, error);
      throw error;
    }
  },
};

export default newsApi;
