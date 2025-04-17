import React, { ReactNode } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StyleProp, 
  ViewStyle 
} from 'react-native';
import { colors } from '../utils/theme';

interface CardProps {
  title?: string;
  subtitle?: string;
  content?: string;
  footer?: string;
  children?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  subtitle, 
  content, 
  footer, 
  children, 
  onPress, 
  style 
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      
      {content && <Text style={styles.content}>{content}</Text>}
      
      {children && <View style={styles.childrenContainer}>{children}</View>}
      
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </CardComponent>
  );
};

// Define colors as constants to avoid color literals
const cardColors = {
  white: colors.white,
  black: colors.black,
  text: colors.grey900,
  secondary: colors.grey600,
};

const styles = StyleSheet.create({
  childrenContainer: {
    marginBottom: 12,
  },
  container: {
    backgroundColor: cardColors.white,
    borderRadius: 8,
    elevation: 2,
    marginBottom: 16,
    padding: 16,
    shadowColor: cardColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    color: cardColors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  footer: {
    color: cardColors.secondary,
    fontSize: 14,
    textAlign: 'right',
  },
  header: {
    marginBottom: 12,
  },
  subtitle: {
    color: cardColors.secondary,
    fontSize: 14,
  },
  title: {
    color: cardColors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default Card;
