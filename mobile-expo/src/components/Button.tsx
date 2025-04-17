import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  StyleProp, 
  ViewStyle, 
  TextStyle,
  View 
} from 'react-native';
import { colors } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  type = 'primary', 
  disabled = false, 
  loading = false, 
  style, 
  textStyle 
}) => {
  // Determine button style based on type and disabled state
  const buttonStyles = [
    styles.button,
    type === 'primary' && styles.primaryButton,
    type === 'secondary' && styles.secondaryButton,
    type === 'outline' && styles.outlineButton,
    disabled && styles.disabledButton,
    style,
  ];

  // Determine text style based on type and disabled state
  const textStyles = [
    styles.text,
    type === 'primary' && styles.primaryText,
    type === 'secondary' && styles.secondaryText,
    type === 'outline' && styles.outlineText,
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={disabled || loading ? 1 : 0.8}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={type === 'outline' ? buttonColors.primary : colors.white}
          />
        )}
        {!loading && (
          <Text style={textStyles}>
            {title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Define colors as constants to avoid color literals
const buttonColors = {
  primary: colors.primary,
  secondary: colors.secondary,
  outline: colors.primary,
  disabled: colors.disabled,
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: buttonColors.primary,
  },
  secondaryButton: {
    backgroundColor: buttonColors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: buttonColors.primary,
  },
  disabledButton: {
    backgroundColor: buttonColors.disabled,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.white,
  },
  outlineText: {
    color: buttonColors.primary,
  },
  disabledText: {
    color: colors.white,
  },
});
