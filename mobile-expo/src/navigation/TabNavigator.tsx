import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './AppNavigator';

// Import screens
import PollsScreen from '../screens/PollsScreen';
import NewsScreen from '../screens/NewsScreen';
import DiscussionsScreen from '../screens/DiscussionsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Define the tab navigator parameter list
export type TabNavigatorParamList = {
  Polls: undefined;
  News: undefined;
  Discussions: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabNavigatorParamList>();

const TabNavigator = () => {
  const { logout, user } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = async () => {
    try {
      await logout();
      // Wait a moment for the auth state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      navigation.navigate('Auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Tab.Navigator
      initialRouteName="Polls"
      screenOptions={({ route }) => ({

        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Polls':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'News':
              iconName = focused ? 'newspaper' : 'newspaper-outline';
              break;
            case 'Discussions':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'alert';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
      })}
    >
      <Tab.Screen 
        name="Polls" 
        component={PollsScreen} 
        options={{ title: 'Polls' }}
      />
      <Tab.Screen 
        name="News" 
        component={NewsScreen} 
        options={{ title: 'News' }}
      />
      <Tab.Screen 
        name="Discussions" 
        component={DiscussionsScreen} 
        options={{ title: 'Discussions' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
});
