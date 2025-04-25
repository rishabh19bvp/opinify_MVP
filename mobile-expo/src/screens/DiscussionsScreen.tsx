import React, { useState, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DiscussionsStackParamList } from '../navigation/DiscussionsStackNavigator';
import { discussionsApi, pollsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import theme from '../utils/theme';

const DiscussionsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DiscussionsStackParamList, 'ChannelsList'>>();
  const userId = useAuthStore(state => state.user?.id);
  const [joinedChannels, setJoinedChannels] = useState<any[]>([]);
  const [suggestedChannels, setSuggestedChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipReloadRef = useRef(false);
  const [selectedSection, setSelectedSection] = useState<'Suggested' | 'Joined'>('Suggested');

  useFocusEffect(
    React.useCallback(() => {
      if (skipReloadRef.current) {
        skipReloadRef.current = false;
        return;
      }
      const load = async () => {
        setLoading(true);
        try {
          const [chRes, pollRes] = await Promise.all([
            discussionsApi.getChannels(),
            pollsApi.getPolls(),
          ]);
          if (!chRes.data.success) throw new Error(chRes.data.error || 'Failed to load channels');
          if (!pollRes.data.success) throw new Error('Failed to load polls');
          const channels = chRes.data.data;
          const polls = pollRes.data.data;
          const pollMap: Record<string, any> = {};
          polls.forEach((p: any) => { pollMap[p._id] = p; });
          const joined = channels.filter((c: any) =>
            c.participants.some((u: any) => {
              const id = u._id ? u._id.toString() : u.toString();
              return id === userId;
            })
          );
          let suggested = channels.filter((c: any) => {
            const poll = pollMap[c.poll._id];
            return (
              poll?.hasVoted &&
              !c.participants.some((u: any) => {
                const id = u._id ? u._id.toString() : u.toString();
                return id === userId;
              })
            );
          });
          suggested.sort((a: any, b: any) => (pollMap[b.poll._id].totalVotes || 0) - (pollMap[a.poll._id].totalVotes || 0));
          setJoinedChannels(joined);
          setSuggestedChannels(suggested);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [userId])
  );

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={theme.colors.primary} />;
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, selectedSection === 'Suggested' && styles.segmentButtonActive]}
          onPress={() => setSelectedSection('Suggested')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, selectedSection === 'Suggested' && styles.segmentTextActive]}>
            Suggested
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, selectedSection === 'Joined' && styles.segmentButtonActive]}
          onPress={() => setSelectedSection('Joined')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, selectedSection === 'Joined' && styles.segmentTextActive]}>
            Joined
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={selectedSection === 'Suggested' ? suggestedChannels : joinedChannels}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('DiscussionDetail', {
              channelId: item._id,
              onJoin: () => {
                skipReloadRef.current = true;
                setJoinedChannels(prev => [...prev, item]);
                setSuggestedChannels(prev => prev.filter(c => c._id !== item._id));
              },
            })}
            activeOpacity={0.8}
          >
            <View style={styles.itemContent}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.desc}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedSection === 'Suggested' ? 'No suggested channels.' : 'No joined channels.'}
            </Text>
          </View>
        )}
        style={styles.list}
        contentContainerStyle={((selectedSection === 'Suggested' && !suggestedChannels.length) || (selectedSection === 'Joined' && !joinedChannels.length)) && styles.emptyContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background },
  errorText: { color: theme.colors.error, fontSize: theme.typography.fontSize.md },
  segmentContainer: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing.xs, borderRadius: theme.borderRadius.sm, marginVertical: theme.spacing.sm },
  segmentButton: { flex: 1, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.sm, justifyContent: 'center', marginHorizontal: theme.spacing.xs },
  segmentButtonActive: { backgroundColor: theme.colors.primary },
  segmentText: { textAlign: 'center', color: theme.colors.textSecondary, fontWeight: '600' },
  segmentTextActive: { color: theme.colors.white },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { flex: 1, padding: theme.spacing.sm, backgroundColor: theme.colors.background },
  item: { backgroundColor: theme.colors.surface, marginHorizontal: theme.spacing.sm, marginVertical: theme.spacing.xs, borderRadius: theme.borderRadius.sm, ...theme.shadows.sm },
  itemContent: { padding: theme.spacing.md },
  name: { fontSize: theme.typography.fontSize.lg, fontWeight: '600', color: theme.colors.text },
  desc: { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  emptyText: { color: theme.colors.textSecondary },
});

export default DiscussionsScreen;
