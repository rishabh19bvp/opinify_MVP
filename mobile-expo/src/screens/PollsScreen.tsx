import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabNavigatorParamList } from '../navigation/TabNavigator';

type PollsScreenProps = BottomTabScreenProps<TabNavigatorParamList, 'Polls'>;

const PollsScreen: React.FC<PollsScreenProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Polls</Text>
      {/* Add polls content here */}
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
});

export default PollsScreen;
