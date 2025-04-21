import React, { useEffect, useRef, useState, memo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePollStore } from '../store/pollStore';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Animated, Easing } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabNavigatorParamList } from '../navigation/TabNavigator';
import { initApi } from '../services/api';
import Constants from 'expo-constants';
import { useLocation } from '../hooks/useLocation';
import { useAuthStore } from '../store/authStore';

// Animation duration for poll bars
const ANIMATION_DURATION = 1200;

interface Poll {
  id: string;
  title: string;
  description: string;
  options: Array<{ text: string; count: number }>;
  totalVotes: number;
  creator: string;
  createdAt: string;
  expiresAt: string;
  location: {
    latitude: number;
    longitude: number;
  };
  hasVoted?: boolean;
  votedOption?: number;
}

type PollsScreenProps = BottomTabScreenProps<TabNavigatorParamList, 'Polls'>;

import AsyncStorage from '@react-native-async-storage/async-storage';

const PollsScreen: React.FC<PollsScreenProps> = ({ navigation }) => {
  const {
    polls,
    votedPolls,
    optimisticVote,
    loading,
    error,
    fetchPolls,
    setVotedPolls,
  } = usePollStore();

  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  const [refreshing, setRefreshing] = React.useState(false);
  // Store the latest vote info for fetchPolls after animation
  const latestVoteRef = React.useRef<{ pollId: string; optionIndex: number } | null>(null);

  // Use location hook
  const { coordinates: userCoordinates, isReady: locationReady, error: locationError } = useLocation();

  // Load voted polls from AsyncStorage only if not already loaded
  useEffect(() => {
    if (Object.keys(votedPolls).length === 0) {
      AsyncStorage.getItem('votedPolls').then((data) => {
        if (data) setVotedPolls(JSON.parse(data));
      });
    }
  }, []);

  // Always refresh polls when this screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchPolls(true, userCoordinates);
    }, [fetchPolls, userCoordinates])
  );

  // Fetch polls if stale or on location change
  useEffect(() => {
    if (locationReady && userCoordinates) {
      fetchPolls(false, userCoordinates);
    }
  }, [locationReady, userCoordinates, fetchPolls]);

  const handleVote = React.useCallback(async (pollId: string, optionIndex: number) => {
    setVotingPollId(pollId);
    optimisticVote(pollId, optionIndex);
    latestVoteRef.current = { pollId, optionIndex };
    try {
      const apiBaseUrl = Constants.expoConfig?.extra?.API_BASE_URL || 
        process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
      if (!apiBaseUrl) throw new Error('API base URL not configured');
      const api = await initApi(apiBaseUrl);
      await api.post(`/api/polls/${pollId}/vote`, { optionIndex });
      // final fetch to sync with server
      await fetchPolls(true, userCoordinates ?? undefined);
      setVotingPollId(null);
    } catch (err: any) {
      console.error('[handleVote] Vote failed:', err);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
      setVotingPollId(null);
    } finally {
      // nothing else; state updated via fetchPolls
    }
  }, [optimisticVote, fetchPolls, userCoordinates]);

  const { token } = useAuthStore();

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPolls(true, userCoordinates ?? undefined);
    setRefreshing(false);
  }

  const formatDistance = (distance: number | string) => {
    if (typeof distance === 'string') return distance;
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const calculateDistance = (poll: Poll) => {
    if (!userCoordinates || typeof userCoordinates.latitude !== 'number' || typeof userCoordinates.longitude !== 'number') {
      return 'Unknown';
    }
    const R = 6371e3; // Earth's radius in meters
    const φ1 = userCoordinates.latitude * Math.PI / 180;
    const φ2 = poll.location.latitude * Math.PI / 180;
    const Δφ = (poll.location.latitude - userCoordinates.latitude) * Math.PI / 180;
    const Δλ = (poll.location.longitude - userCoordinates.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const PollCard: React.FC<{ item: Poll }> = ({ item }) => {
      const total = item.totalVotes || 1;
      const yesPct = (item.options[0]?.count || 0) / total;
      const noPct = (item.options[1]?.count || 0) / total;
      const distance = calculateDistance(item);
      const formattedDistance = formatDistance(distance);
      const hasVoted = typeof item.hasVoted === 'boolean'
        ? item.hasVoted
        : votedPolls[item.id] !== undefined;
      const isVoting = item.id === votingPollId;

      // animated values for bars
      const yesAnim = useRef(new Animated.Value(0)).current;
      const noAnim = useRef(new Animated.Value(0)).current;

      useEffect(() => {
        if (!hasVoted) {
          yesAnim.setValue(0);
          noAnim.setValue(0);
          return;
        }

        // Always animate smoothly
        Animated.parallel([
          Animated.timing(yesAnim, {
            toValue: yesPct,
            duration: ANIMATION_DURATION,
            easing: Easing.bezier(0.4, 0, 0.2, 1), // Smooth sliding
            useNativeDriver: false
          }),
          Animated.timing(noAnim, {
            toValue: noPct,
            duration: ANIMATION_DURATION,
            easing: Easing.bezier(0.4, 0, 0.2, 1), // Smooth sliding
            useNativeDriver: false
          })
        ]).start();
      }, [hasVoted, isVoting, yesPct, noPct]);

      return (
        <View style={styles.card}>
          <View style={styles.pollHeader}>
            <Text style={styles.pollTitle}>{item.title}</Text>
            <Text style={styles.pollDistance}>{formattedDistance} away</Text>
          </View>
          <Text style={styles.pollDescription}>{item.description}</Text>
          <View style={styles.pollOptions}>
            {hasVoted ? (
              <>
                <View style={styles.barRow}>
                  <Text style={styles.optionText}>Yes</Text>
                  <View style={styles.barBackground}>
                    <Animated.View style={[styles.barFill, styles.yesBar, { width: yesAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }) }]} />
                  </View>
                  <Text style={styles.voteCount}>{item.options[0]?.count || 0}</Text>
                </View>
                <View style={styles.barRow}>
                  <Text style={styles.optionText}>No</Text>
                  <View style={styles.barBackground}>
                    <Animated.View style={[styles.barFill, styles.noBar, { width: noAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }) }]} />
                  </View>
                  <Text style={styles.voteCount}>{item.options[1]?.count || 0}</Text>
                </View>
              </>
            ) : (
              item.options.map((option, index) => (
                <TouchableOpacity
                  key={option.text + index}
                  disabled={hasVoted}
                  style={styles.optionContainer}
                  onPress={() => handleVote(item.id, index)}
                >
                  <Text style={styles.optionText}>{option.text}</Text>
                  <Text style={styles.voteCount}>{option.count} votes</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      );
    };

  // Helper for stable option style
  const getOptionStyle = React.useCallback(() => {
    return [styles.optionContainer];
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Polls</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchPolls(true, userCoordinates)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Polls</Text>
      <FlatList
        data={polls}
        renderItem={({ item }) => <PollCard item={item} />}
        keyExtractor={item => item.id}
        extraData={[polls, votingPollId]}
        onRefresh={handleRefresh}
        refreshing={refreshing || loading}
        ListFooterComponent={loading ? <ActivityIndicator style={styles.loadingIndicator} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 10,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    // Android shadow
    elevation: 5,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 8,
    gap: 10,
  },
  barBackground: {
    flex: 1,
    height: 22,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
    height: 22,
  },
  yesBar: {
    backgroundColor: '#3182ce', // blue
  },
  noBar: {
    backgroundColor: '#e53e3e', // red
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pollCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pollTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
  },
  pollDistance: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  pollDescription: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 15,
    lineHeight: 22,
  },
  pollOptions: {
    marginBottom: 10,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionText: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '500',
    flex: 1,
  },
  voteCount: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
  },
  pollFooter: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalVotes: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
    fontWeight: '500',
  },
  createdAt: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  loadingIndicator: {
    padding: 20,
  }
});

export default PollsScreen;
