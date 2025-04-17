import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabNavigatorParamList } from '../navigation/TabNavigator';

type DiscussionsScreenProps = BottomTabScreenProps<TabNavigatorParamList, 'Discussions'>;

const DiscussionsScreen: React.FC<DiscussionsScreenProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discussions</Text>
      {/* Add discussions content here */}
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

export default DiscussionsScreen;
