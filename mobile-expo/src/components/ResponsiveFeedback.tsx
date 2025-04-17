import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

interface ResponsiveFeedbackProps {
  onAction: () => Promise<void>;
  disabled?: boolean;
  children: React.ReactNode;
}

export const ResponsiveFeedback: React.FC<ResponsiveFeedbackProps> = ({
  onAction,
  disabled = false,
  children
}) => {
  const [isLoading, setLoading] = useState(false);

  const handleAction = async () => {
    if (disabled || isLoading) return;
    
    setLoading(true);
    try {
      await onAction();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        React.cloneElement(children as React.ReactElement, {
          onPress: handleAction,
          disabled: disabled || isLoading
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
});
