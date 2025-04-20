import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { initApi } from '../services/api';

export interface PollOption {
  text: string;
  count: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  creator: string;
  createdAt: string;
  expiresAt: string;
  location: { latitude: number; longitude: number };
  hasVoted?: boolean;
  votedOption?: number;
}


interface PollStore {
  polls: Poll[];
  votedPolls: Record<string, number>;
  votingPoll: string | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  setVotedPolls: (voted: Record<string, number>) => void;
  setVotingPoll: (pollId: string | null) => void;
  optimisticVote: (pollId: string, optionIndex: number) => void;
  fetchPolls: (force?: boolean, coordinates?: { latitude: number; longitude: number } | null) => Promise<void>;
}

export const usePollStore = create<PollStore>((set, get) => ({
  polls: [],
  votedPolls: {},
  votingPoll: null,
  loading: false,
  error: null,
  lastFetched: null,
  setVotedPolls: (voted: Record<string, number>) => {
    set({ votedPolls: voted });
    AsyncStorage.setItem('votedPolls', JSON.stringify(voted));
  },
  setVotingPoll: (pollId: string | null) => set({ votingPoll: pollId }),
  optimisticVote: (pollId: string, optionIndex: number) => {
    set((state) => {
      const updatedPolls = state.polls.map((poll: Poll) => {
        if (poll.id !== pollId) return poll;
        const updatedOptions = poll.options.map((opt: PollOption, idx: number) =>
          idx === optionIndex ? { ...opt, count: opt.count + 1 } : opt
        );
        return {
          ...poll,
          options: updatedOptions,
          totalVotes: poll.totalVotes + 1,
          hasVoted: true,
          votedOption: optionIndex,
        };
      });
      const updatedVoted = { ...state.votedPolls, [pollId]: optionIndex };
      AsyncStorage.setItem('votedPolls', JSON.stringify(updatedVoted));
      return {
        polls: updatedPolls,
        votedPolls: updatedVoted,
        votingPoll: pollId,
      };
    });
  },
  fetchPolls: async (force = false, coordinates = null) => {
    const now = Date.now();
    const lastFetched = get().lastFetched;
    if (!force && typeof lastFetched === 'number' && now - lastFetched < 60000) {
      // Cache is fresh (less than 1 minute)
      return;
    }
    set({ loading: true, error: null });
    try {
      const apiBaseUrl = Constants.expoConfig?.extra?.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
      if (!apiBaseUrl) throw new Error('API base URL not configured');
      const api = await initApi(apiBaseUrl);
      const response = await api.get('/api/polls', {
        params: (() => {
          if (coordinates && typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number') {
            return {
              page: 1,
              limit: 10,
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              radius: 5000
            };
          }
          return {
            page: 1,
            limit: 10
          };
        })()
      });
      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch polls');
      }
      const newPolls = data.data.map((poll: any) => ({
        id: poll._id.toString(),
        title: poll.title || 'Untitled Poll',
        description: poll.description || '',
        options: poll.options || [],
        totalVotes: poll.totalVotes || 0,
        creator: poll.creator?.username || 'Anonymous',
        createdAt: poll.createdAt || '',
        expiresAt: poll.expiresAt || '',
        location: poll.location?.coordinates ? {
          latitude: poll.location.coordinates[1],
          longitude: poll.location.coordinates[0]
        } : {
          latitude: 0,
          longitude: 0
        },
        hasVoted: poll.hasVoted ?? false,
        votedOption: poll.votedOption
      } as Poll));
      const oldPolls: Poll[] = get().polls || [];
      // Build a map for fast lookup
      const oldPollMap = Object.fromEntries(oldPolls.map(p => [p.id, p]));
      const fieldsToCheck = [
        'options',
        'totalVotes',
        'hasVoted',
        'votedOption',
        'title',
        'description',
        'creator',
        'createdAt',
        'expiresAt',
        'location',
      ];
      const mergedPolls = newPolls.map((newPoll: Poll) => {
        const oldPoll = oldPollMap[newPoll.id];
        if (!oldPoll) return newPoll;
        const isSame = fieldsToCheck.every(field => {
          if (field === 'options') {
            return JSON.stringify((oldPoll as any)[field]) === JSON.stringify((newPoll as any)[field]);
          }
          if (typeof (oldPoll as any)[field] === 'object' && (oldPoll as any)[field] !== null) {
            return JSON.stringify((oldPoll as any)[field]) === JSON.stringify((newPoll as any)[field]);
          }
          return (oldPoll as any)[field] === (newPoll as any)[field];
        });
        return isSame ? oldPoll : newPoll;
      });
      // Patch hasVoted and votedOption ONLY for the poll that matches the current optimistic vote (if any)
      const votingPollId = get().votingPoll;
      const votedPolls = get().votedPolls || {};
      const patchedPolls = mergedPolls.map((poll: Poll) => {
        if (poll.id === votingPollId && votedPolls[poll.id] !== undefined) {
          return {
            ...poll,
            hasVoted: true,
            votedOption: votedPolls[poll.id],
          };
        }
        // For all other polls, use backend values
        return poll;
      });
      set({ polls: patchedPolls, lastFetched: now });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch polls' });
    } finally {
      set({ loading: false });
    }
  },
}))
