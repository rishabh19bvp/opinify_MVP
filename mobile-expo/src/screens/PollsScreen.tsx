import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePollStore } from '../store/pollStore';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabNavigatorParamList } from '../navigation/TabNavigator';
import { initApi } from '../services/api';
import Constants from 'expo-constants';
import { useLocation } from '../hooks/useLocation';
import { useAuthStore } from '../store/authStore';

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

import { Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PollsScreen: React.FC<PollsScreenProps> = ({ navigation }) => {
  const {
    polls,
    votedPolls,
    votingPoll,
    optimisticVote,
    loading,
    error,
    fetchPolls,
    setVotedPolls,
  } = usePollStore();

  const [refreshing, setRefreshing] = React.useState(false);
  // Track which poll is animating due to optimistic update
  const [optimisticAnimatingPollId, setOptimisticAnimatingPollId] = React.useState<string | null>(null);


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

  // Per-poll animation state
  const [animatingPolls, setAnimatingPolls] = React.useState<{ [id: string]: boolean }>({});
  // Store the latest vote info for fetchPolls after animation
  const latestVoteRef = React.useRef<{ pollId: string; optionIndex: number } | null>(null);

  // Memoized handleVote to avoid re-renders
  const handleVote = React.useCallback(async (pollId: string, optionIndex: number) => {
    setAnimatingPolls(prev => ({ ...prev, [pollId]: true }));
    optimisticVote(pollId, optionIndex);
    latestVoteRef.current = { pollId, optionIndex };
    try {
      // console.log(`[handleVote] Voting on pollId=${pollId}, optionIndex=${optionIndex}`);
      const apiBaseUrl = Constants.expoConfig?.extra?.API_BASE_URL || 
        process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
      if (!apiBaseUrl) throw new Error('API base URL not configured');
      const api = await initApi(apiBaseUrl);
      await api.post(`/api/polls/${pollId}/vote`, { optionIndex });
      // Do NOT fetchPolls here; wait for animation end
    } catch (err: any) {
      console.error('[handleVote] Vote failed:', err);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
      // Optionally revert optimistic update if needed
    } finally {
      usePollStore.getState().setVotingPoll(null);
    }
  }, [optimisticVote]);



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

  // PollResultBar: Animated bar for poll results
  const PollResultBar: React.FC<{
    optionText: string;
    count: number;
    totalVotes: number;
    colorStyle: any;
    shouldAnimate?: boolean;
    onAnimationEnd?: () => void;
  }> = ({ optionText, count, totalVotes, colorStyle, shouldAnimate, onAnimationEnd }) => {
    // console.log(`[PollResultBar] Render: optionText=${optionText}, count=${count}, totalVotes=${totalVotes}, shouldAnimate=${shouldAnimate}`);
    const anim = React.useRef(new Animated.Value(0)).current;
    const prevPct = React.useRef(0);
    const prevShouldAnimate = React.useRef(false);

    useEffect(() => {
      const pct = totalVotes > 0 ? count / totalVotes : 0;
      if (shouldAnimate && !prevShouldAnimate.current) {
        // console.log(`[PollResultBar] Animation START for ${optionText}, from ${prevPct.current} to ${pct}`);
        anim.setValue(prevPct.current);
        Animated.timing(anim, {
          toValue: pct,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false
        }).start(({ finished }) => {
          if (finished && onAnimationEnd) onAnimationEnd();
          // console.log(`[PollResultBar] Animation END for ${optionText}`);
        });
        prevPct.current = pct;
      } else if (!shouldAnimate) {
        anim.setValue(pct);
        prevPct.current = pct;
      }
      prevShouldAnimate.current = shouldAnimate || false;
    }, [shouldAnimate, count, totalVotes]);
    return (
      <View style={styles.barRow}>
        <Text style={styles.optionText}>{optionText}</Text>
        <View style={styles.barBackground}>
          <Animated.View
            style={[
              styles.barFill,
              colorStyle,
              {
                width: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />
        </View>
        <Text style={styles.voteCount}>{count}</Text>
      </View>
    );
  };


  // Helper for stable option style
  const getOptionStyle = React.useCallback((isVoting: boolean) => {
    return isVoting ? [styles.optionContainer, styles.votingOption] : [styles.optionContainer];
  }, []);

  const PollCard = React.memo(
    ({ item, isAnimating }: { item: Poll; isAnimating: boolean }) => {
      // Diagnostics: log poll render
      // console.log(`[FlatList] Rendering poll card for id=${item.id}, isAnimating=${isAnimating}`);
      // Reset animation after it runs
      // Only call fetchPolls once after both bars finish animating
      const hasFetchedRef = React.useRef(false);
      const handleAnimationEnd = React.useCallback(() => {
        if (isAnimating) {
          setAnimatingPolls(prev => ({ ...prev, [item.id]: false }));
          // Only fetch polls once after both bars finish animating
          if (latestVoteRef.current && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchPolls(true).finally(() => {
              latestVoteRef.current = null;
              hasFetchedRef.current = false;
            });
          }
        }
      }, [isAnimating, item.id, fetchPolls]);
      const distance = calculateDistance(item);
      const formattedDistance = formatDistance(distance);
      const isVoting = votingPoll === item.id;
      const hasVoted = typeof item.hasVoted === 'boolean' ? item.hasVoted : usePollStore.getState().votedPolls[item.id] !== undefined;
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
                <PollResultBar
                  optionText="Yes"
                  count={item.options[0]?.count || 0}
                  totalVotes={item.totalVotes}
                  colorStyle={styles.yesBar}
                  shouldAnimate={isAnimating}
                  onAnimationEnd={handleAnimationEnd}
                />
                <PollResultBar
                  optionText="No"
                  count={item.options[1]?.count || 0}
                  totalVotes={item.totalVotes}
                  colorStyle={styles.noBar}
                  shouldAnimate={isAnimating}
                  onAnimationEnd={handleAnimationEnd}
                />
              </>
            ) : (
              item.options.map((option, index) => (
                <TouchableOpacity
                  key={option.text + index}
                  style={getOptionStyle(isVoting)}
                  onPress={() => handleVote(item.id, index)}
                  disabled={isVoting}
                >
                  <Text style={styles.optionText}>{option.text}</Text>
                  <Text style={styles.voteCount}>{option.count} votes</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      );
    },
    (prev, next) => prev.item === next.item && prev.isAnimating === next.isAnimating
  );



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
      {/* Ensure each poll has hasVoted property for FlatList type safety */}
      {/* Memoize animatingPollsKeys for stable extraData */}
      {(() => {
        const animatingPollsKeys = React.useMemo(
          () => Object.keys(animatingPolls).filter(id => animatingPolls[id]).join(','),
          [animatingPolls]
        );
        return (
          <FlatList
            data={polls}
            renderItem={({ item }) => (
              <PollCard item={item} isAnimating={!!animatingPolls[item.id]} />
            )}
            keyExtractor={item => item.id}
            extraData={animatingPollsKeys}
            onRefresh={handleRefresh}
            refreshing={refreshing || loading}
            ListFooterComponent={
              loading ? (
                <ActivityIndicator style={styles.loadingIndicator} />
              ) : null
            }
          />
        );
      })()}

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
  votingOption: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
    borderColor: '#e2e8f0',
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
