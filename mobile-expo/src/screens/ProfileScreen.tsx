import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabNavigatorParamList } from '../navigation/TabNavigator';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';

type ProfileScreenProps = BottomTabScreenProps<TabNavigatorParamList, 'Profile'>;

const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      {user && (
        <>
          <Text style={styles.info}>Email: {user.email}</Text>
          {user.username && (
            <Text style={styles.info}>Username: {user.username}</Text>
          )}
        </>
      )}
      
      <Button
        title="Logout"
        onPress={handleLogout}
        type="secondary"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default ProfileScreen;
