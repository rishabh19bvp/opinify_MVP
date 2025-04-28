import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

let apiInstance: AxiosInstance | null = null;

export const initApi = async (baseUrl: string): Promise<AxiosInstance> => {
  if (apiInstance) {
    return apiInstance;
  }

  // Use baseUrl as-is to support /api prefix
  console.log('Creating API instance with base URL:', baseUrl);

  apiInstance = axios.create({
    baseURL: baseUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Add a request interceptor to add auth token to requests
  apiInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Get the token from the auth store
      const token = useAuthStore.getState().token;
      
      // If token exists, add it to the headers
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('API REQUEST TOKEN:', token);
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add a response interceptor to handle errors
  apiInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: any) => {
      // Handle specific error cases
      if (error.response) {
        // Server responded with a status code outside of 2xx
        console.error('API Error:', error.response.data);
        
        // Handle unauthorized errors (401)
        if (error.response.status === 401) {
          // Clear auth state
          useAuthStore.setState({ 
            user: null, 
            token: null, 
          });
        }
      } else if (error.request) {
        // Request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return apiInstance;
};

// Export specific API endpoints
export const authApi = {
  login: async (email: string, password: string) => {
    return apiInstance!.post('/auth/login', { email, password });
  },
  register: async (email: string, password: string, username: string) => {
    return apiInstance!.post('/auth/register', { email, password, username });
  },
  refreshToken: async () => {
    return apiInstance!.post('/auth/refresh');
  },
};

export const pollsApi = {
  getPolls: () => apiInstance!.get('/api/polls'),
  createPoll: async (data: any) => apiInstance!.post('/api/polls', data),
  getNearbyPolls: async (latitude: number, longitude: number, radius: number = 10000) => apiInstance!.get(`/api/polls/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`),
  votePoll: async (pollId: string, optionId: string) => apiInstance!.post(`/api/polls/${pollId}/vote`, { optionId }),
  getPoll: async (pollId: string) => apiInstance!.get(`/api/polls/${pollId}`),
};

export const newsApi = {
  getNearbyNews: async (latitude: number, longitude: number, radius: number = 10000) => {
    return apiInstance!.get(`/news/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`);
  },
  getNewsSources: async () => {
    return apiInstance!.get('/news/sources');
  },
  getNewsBySource: async (sourceId: string) => {
    return apiInstance!.get(`/news/source/${sourceId}`);
  },
};

export const discussionsApi = {
  createDiscussion: (data: any) => apiInstance!.post('/api/discussions', data),
  getChannels: (pollId?: string, active?: boolean) =>
    apiInstance!.get('/api/discussions', { params: { pollId, active } }),
  getDiscussion: (discussionId: string) => apiInstance!.get(`/api/discussions/${discussionId}`),
  joinDiscussion: (discussionId: string) => apiInstance!.post(`/api/discussions/${discussionId}/join`),
  leaveDiscussion: (discussionId: string) => apiInstance!.post(`/api/discussions/${discussionId}/leave`),
  postMessage: (discussionId: string, content: string) =>
    apiInstance!.post(`/api/discussions/${discussionId}/messages`, { content }),
  getMessages: (discussionId: string) =>
    apiInstance!.get(`/api/discussions/${discussionId}/messages`),
  markAsRead: (channelId: string, messageId: string) =>
    apiInstance!.post(`/api/discussions/${channelId}/messages/${messageId}/read`),
  closeDiscussion: (discussionId: string) =>
    apiInstance!.put(`/api/discussions/${discussionId}/close`),
};

export default apiInstance || null;
