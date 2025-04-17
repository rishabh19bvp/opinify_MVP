import apiClient from './apiClient';
import firebase from '../services/firebase';
import { useLocationStore } from '../store/locationStore';

// Poll types
export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  totalVotes: number;
  category: string;
  tags: string[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface CreatePollRequest {
  question: string;
  options: string[];
  expiresIn: number; // in hours
  radius: number; // in kilometers
  category: string;
  tags: string[];
}

export interface VotePollRequest {
  optionId: string;
}

// Polls API service
const pollsApi = {
  // Get polls near the user's location
  getNearbyPolls: async (radius: number = 5): Promise<Poll[]> => {
    try {
      const location = useLocationStore.getState().currentLocation;
      
      if (!location) {
        throw new Error('Location not available');
      }
      
      const response = await apiClient.get<Poll[]>('/polls/nearby', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius,
        },
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching nearby polls:', error);
      throw error;
    }
  },
  
  // Get trending polls
  getTrendingPolls: async (): Promise<Poll[]> => {
    try {
      const response = await apiClient.get<Poll[]>('/polls/trending');
      return response;
    } catch (error) {
      console.error('Error fetching trending polls:', error);
      throw error;
    }
  },
  
  // Get polls by category
  getPollsByCategory: async (category: string): Promise<Poll[]> => {
    try {
      const response = await apiClient.get<Poll[]>(`/polls/category/${category}`);
      return response;
    } catch (error) {
      console.error(`Error fetching polls for category ${category}:`, error);
      throw error;
    }
  },
  
  // Get a specific poll by ID
  getPoll: async (pollId: string): Promise<Poll> => {
    try {
      const response = await apiClient.get<Poll>(`/polls/${pollId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching poll ${pollId}:`, error);
      throw error;
    }
  },
  
  // Create a new poll
  createPoll: async (pollData: CreatePollRequest): Promise<Poll> => {
    try {
      const location = useLocationStore.getState().currentLocation;
      
      if (!location) {
        throw new Error('Location not available');
      }
      
      const response = await apiClient.post<Poll>('/polls', {
        ...pollData,
        location,
      });
      
      return response;
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  },
  
  // Vote on a poll
  votePoll: async (pollId: string, optionId: string): Promise<Poll> => {
    try {
      const response = await apiClient.post<Poll>(`/polls/${pollId}/vote`, {
        optionId,
      });
      
      return response;
    } catch (error) {
      console.error(`Error voting on poll ${pollId}:`, error);
      throw error;
    }
  },
};

export default pollsApi;
