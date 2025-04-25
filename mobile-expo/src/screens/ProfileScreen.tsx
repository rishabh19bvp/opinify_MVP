import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabNavigatorParamList } from '../navigation/TabNavigator';
import { useAuthStore } from '../store/authStore';
import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import theme from '../utils/theme';

type ProfileScreenProps = BottomTabScreenProps<TabNavigatorParamList, 'Profile'>;

const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const rootNavigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user, logout, checkAuthStatus } = useAuthStore();
  const isFocused = useIsFocused();
  useEffect(() => { if (isFocused) { checkAuthStatus(); } }, [isFocused]);
  const handleLogout = async () => { try { await logout(); } catch (error) { console.error('Logout error:', error); } };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {user && (
          <>
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                {user.profile?.avatarUrl ? (
                  <Image source={{ uri: user.profile.avatarUrl }} style={styles.avatar} />
                ) : (
                  <Text style={styles.avatarPlaceholder}>{(user.username || '').charAt(0).toUpperCase()}</Text>
                )}
              </View>
              {(user.profile?.firstName || user.profile?.lastName) && (
                <Text style={styles.name}>{`${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim()}</Text>
              )}
              <Text style={styles.handle}>@{user.username}</Text>
              <TouchableOpacity style={styles.editButton} onPress={() => rootNavigation.navigate('EditProfile')} activeOpacity={0.8}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Social stats: Followers/Following */}
            <View style={styles.socialCard}>
              <TouchableOpacity style={styles.socialStat} activeOpacity={0.7}>
                <Text style={styles.socialValue}>0</Text>
                <Text style={styles.socialLabel}>Followers</Text>
              </TouchableOpacity>
              <View style={styles.socialDivider} />
              <TouchableOpacity style={styles.socialStat} activeOpacity={0.7}>
                <Text style={styles.socialValue}>0</Text>
                <Text style={styles.socialLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            {/* Membership stats: Polls Voted & Groups Joined */}
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{user.pollsVoted ?? 0}</Text>
                  <Text style={styles.statsLabel}>Polls Voted</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{user.groupsCount ?? 0}</Text>
                  <Text style={styles.statsLabel}>Groups Joined</Text>
                </View>
              </View>
            </View>

            {/* Email & Bio */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              {user.profile?.bio && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bio</Text>
                  <Text style={styles.infoValue}>{user.profile.bio}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { alignItems: 'center', padding: theme.spacing.md },
  header: { alignItems: 'center', marginVertical: theme.spacing.lg },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.md,
  },
  avatar: { width: 120, height: 120, borderRadius: theme.borderRadius.round },
  avatarPlaceholder: { fontSize: theme.typography.fontSize.xxxl, color: theme.colors.textSecondary },
  name: { fontSize: theme.typography.fontSize.xxl, fontWeight: '600', color: theme.colors.text, marginTop: theme.spacing.xs },
  handle: { fontSize: theme.typography.fontSize.md, color: theme.colors.textSecondary },
  editButton: { borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.borderRadius.lg, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.xl, alignSelf: 'center', marginTop: theme.spacing.md, marginBottom: theme.spacing.lg },
  editButtonText: { fontSize: theme.typography.fontSize.md, color: theme.colors.primary, fontWeight: '600' },

  // Social stats styles
  socialCard: {
    flexDirection: 'row',
    width: '90%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  socialValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  socialLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  socialDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },

  // Membership stats styles
  statsCard: {
    width: '90%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statsIcon: {
    fontSize: theme.typography.fontSize.xl,
    marginBottom: theme.spacing.xs,
  },
  statsValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statsLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },

  // Info card styles
  infoCard: {
    width: '90%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },


  logoutButton: {
    width: '100%',
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  logoutText: { color: theme.colors.white, fontSize: theme.typography.fontSize.md, fontWeight: '600' },
});

export default ProfileScreen;
