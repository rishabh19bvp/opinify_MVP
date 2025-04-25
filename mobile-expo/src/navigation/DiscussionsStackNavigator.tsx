import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DiscussionsScreen from '../screens/DiscussionsScreen';
import DiscussionDetailScreen from '../screens/DiscussionDetailScreen';

export type DiscussionsStackParamList = {
  ChannelsList: undefined;
  DiscussionDetail: { channelId: string; onJoin?: () => void; onLeave?: () => void };
};

const Stack = createStackNavigator<DiscussionsStackParamList>();

export default function DiscussionsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChannelsList"
        component={DiscussionsScreen}
        options={{ title: 'Discussions' }}
      />
      <Stack.Screen
        name="DiscussionDetail"
        component={DiscussionDetailScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
}
