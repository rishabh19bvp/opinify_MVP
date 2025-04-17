import apiClient from './apiClient';
import firebase from '../services/firebase';
import { useLocationStore } from '../store/locationStore';

// Discussion types
export interface Message {
  id: string;
  text: string;
  createdBy: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    photoURL?: string;
  };
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  category: string;
  tags: string[];
  participantsCount: number;
  lastMessage?: {
    text: string;
    createdAt: Date;
    user: {
      username: string;
    };
  };
}

export interface CreateChannelRequest {
  name: string;
  description: string;
  radius: number;
  category: string;
  tags: string[];
}

// Discussions API service
const discussionsApi = {
  // Get channels near the user's location
  getNearbyChannels: async (radius: number = 5): Promise<Channel[]> => {
    try {
      const location = useLocationStore.getState().currentLocation;
      
      if (!location) {
        throw new Error('Location not available');
      }
      
      const response = await apiClient.get<Channel[]>('/discussions/channels/nearby', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius,
        },
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching nearby channels:', error);
      throw error;
    }
  },
  
  // Get popular channels
  getPopularChannels: async (): Promise<Channel[]> => {
    try {
      const response = await apiClient.get<Channel[]>('/discussions/channels/popular');
      return response;
    } catch (error) {
      console.error('Error fetching popular channels:', error);
      throw error;
    }
  },
  
  // Get channels by category
  getChannelsByCategory: async (category: string): Promise<Channel[]> => {
    try {
      const response = await apiClient.get<Channel[]>(`/discussions/channels/category/${category}`);
      return response;
    } catch (error) {
      console.error(`Error fetching channels for category ${category}:`, error);
      throw error;
    }
  },
  
  // Get a specific channel by ID
  getChannel: async (channelId: string): Promise<Channel> => {
    try {
      const response = await apiClient.get<Channel>(`/discussions/channels/${channelId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching channel ${channelId}:`, error);
      throw error;
    }
  },
  
  // Create a new channel
  createChannel: async (channelData: CreateChannelRequest): Promise<Channel> => {
    try {
      const location = useLocationStore.getState().currentLocation;
      
      if (!location) {
        throw new Error('Location not available');
      }
      
      const response = await apiClient.post<Channel>('/discussions/channels', {
        ...channelData,
        location,
      });
      
      return response;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  },
  
  // Get messages for a channel
  getMessages: async (channelId: string): Promise<Message[]> => {
    try {
      const response = await apiClient.get<Message[]>(`/discussions/channels/${channelId}/messages`);
      return response;
    } catch (error) {
      console.error(`Error fetching messages for channel ${channelId}:`, error);
      throw error;
    }
  },
  
  // Send a message to a channel
  sendMessage: async (channelId: string, text: string): Promise<Message> => {
    try {
      const response = await apiClient.post<Message>(`/discussions/channels/${channelId}/messages`, {
        text,
      });
      
      return response;
    } catch (error) {
      console.error(`Error sending message to channel ${channelId}:`, error);
      throw error;
    }
  },
  
  // Subscribe to real-time messages for a channel
  subscribeToMessages: (channelId: string, callback: (messages: Message[]) => void) => {
    const messagesRef = firebase.database().ref(`channels/${channelId}/messages`);
    
    messagesRef.on('value', (snapshot) => {
      const messages: Message[] = [];
      // Use a different approach to iterate through the snapshot
      const snapshotValue = snapshot.val() || {};
      Object.keys(snapshotValue).forEach(key => {
        messages.push({
          id: key,
          ...snapshotValue[key],
        });
      });
      
      callback(messages);
    });
    
    // Return unsubscribe function
    return () => {
      messagesRef.off();
    };
  },
};

export default discussionsApi;
