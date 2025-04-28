import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { DiscussionsStackParamList } from '../navigation/DiscussionsStackNavigator';
import { discussionsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import theme from '../utils/theme';

type Props = RouteProp<DiscussionsStackParamList, 'DiscussionDetail'>;

const DiscussionDetailScreen: React.FC = ({ navigation }: any) => {
  // Dynamically hide tab bar on chat room
  useLayoutEffect(() => {
    navigation.getParent()?.setOptions({ tabBarVisible: false });
    return () => navigation.getParent()?.setOptions({ tabBarVisible: true });
  }, [navigation]);
  const { channelId, onJoin } = useRoute<Props>().params;
  const userId = useAuthStore(state => state.user?.id);
  const authUser = useAuthStore(state => state.user);
  const [channel, setChannel] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [joined, setJoined] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const chRes = await discussionsApi.getDiscussion(channelId);
      if (chRes.data.success) {
        const channelData = chRes.data.data;
        setChannel(channelData);
        const isParticipant = channelData.participants.some((u: any) => u._id.toString() === userId);
        setJoined(isParticipant);
        if (isParticipant) {
          const mRes = await discussionsApi.getMessages(channelId);
          if (mRes.data.success) setMsgs(mRes.data.data);
        } else {
          setMsgs([]);
        }
      }
    } catch (e) {
      console.error('Error loading discussion:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [channelId]);

  if (loading) {
    return <ActivityIndicator style={styles.loading} size="large" color={theme.colors.primary} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={140} // Increased for tab bar/safe area
      >
        <View style={styles.container}>
          <View style={styles.header} onLayout={e => console.log('Header height:', e.nativeEvent.layout.height)}>
            <View style={styles.channelInfoRow} onLayout={e => console.log('ChannelInfoRow height:', e.nativeEvent.layout.height)}>
              <Text style={styles.channelName} numberOfLines={1} ellipsizeMode="tail">{channel?.name}</Text>
              <TouchableOpacity style={[styles.joinButton, joined && styles.leaveButton]} disabled={joinLoading} onPress={async () => {
                setJoinLoading(true);
                try {
                  if (joined) {
                    await discussionsApi.leaveDiscussion(channelId);
                    await loadAll();
                  } else {
                    try {
                      await discussionsApi.joinDiscussion(channelId);
                    } catch (e: any) {
                      const err = e.response?.data?.error || e.message;
                      // Treat already-a-participant or duplicate-key as success
                      if (!(typeof err === 'string' && (err.includes('participant') || err.includes('duplicate key')))) {
                        throw e;
                      }
                    }
                    onJoin?.();
                    navigation.goBack();
                  }
                } catch (e) {
                  console.error('Error toggling join:', e);
                } finally {
                  setJoinLoading(false);
                }
              }} activeOpacity={0.8}>
                <Text style={styles.joinButtonText}>
                  {joined ? (joinLoading ? 'Leaving...' : 'Leave') : (joinLoading ? 'Joining...' : 'Join')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.listContainer}>
            <FlatList
              style={styles.messages}
              contentContainerStyle={{ flexGrow: 1 }}
              data={msgs}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                // Determine sender name: populated username, own username, or ID
                const senderName =
                  item.sender && typeof item.sender === 'object' && 'username' in item.sender
                    ? (item.sender as any).username
                    : item.sender === userId
                      ? authUser?.username
                      : item.sender;
                return (
                  <View style={styles.msg}>
                    <Text style={styles.sender}>{senderName}</Text>
                    <Text>{item.content}</Text>
                  </View>
                );
              }}
              ListEmptyComponent={() => (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
                </View>
              )}
            />
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message…"
            />
            <TouchableOpacity style={styles.sendButton} onPress={async () => {
              if (!text) return;
              try {
                await discussionsApi.postMessage(channelId, text);
                setText('');
                loadAll();
              } catch (e) {
                console.error('Error sending message:', e);
              }
            }} activeOpacity={0.8}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  keyboardAvoid: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
  width: '100%',
  paddingTop: theme.spacing.sm,
  paddingBottom: theme.spacing.xs,
  paddingHorizontal: theme.spacing.lg,
  backgroundColor: theme.colors.grey100,
  borderBottomWidth: 1,
  borderColor: theme.colors.divider,
  borderTopLeftRadius: theme.borderRadius.lg,
  borderTopRightRadius: theme.borderRadius.lg,
  alignSelf: 'center',
},
  channelInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  channelName: { flex: 1, fontSize: theme.typography.fontSize.xl, fontWeight: '700', color: theme.colors.text, marginRight: theme.spacing.md, textAlignVertical: 'center' },
  joinButton: { backgroundColor: theme.colors.primary, paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.lg, borderRadius: theme.borderRadius.round, minWidth: 64, alignItems: 'center', justifyContent: 'center', height: 36, shadowColor: theme.colors.primary, shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  leaveButton: { backgroundColor: theme.colors.error },
  joinButtonText: { color: theme.colors.white, fontWeight: '600', fontSize: theme.typography.fontSize.md, letterSpacing: 0.2 },
  messages: { flex: 1, padding: theme.spacing.sm },
emptyState: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: theme.spacing.xl,
},
  msg: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.sm, padding: theme.spacing.sm, marginVertical: theme.spacing.xs, marginHorizontal: theme.spacing.sm, ...theme.shadows.sm },
  sender: { fontWeight: '600', color: theme.colors.primary, marginBottom: theme.spacing.xs, fontSize: theme.typography.fontSize.md },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.sm, borderTopWidth: 1, borderColor: theme.colors.divider, backgroundColor: theme.colors.surface, paddingVertical: theme.spacing.sm, ...theme.shadows.md, position: 'absolute', left: 0, right: 0, bottom: 0 },
  input: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.sm, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.sm, marginRight: theme.spacing.sm, color: theme.colors.text },
  sendButton: { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.sm },
  sendButtonText: { color: theme.colors.white, fontWeight: '600' },
  listContainer: { flex: 1, paddingBottom: theme.spacing.xxl },
  empty: { alignItems: 'center', marginTop: theme.spacing.lg },
  emptyText: { color: theme.colors.textSecondary },
});

export default DiscussionDetailScreen;
