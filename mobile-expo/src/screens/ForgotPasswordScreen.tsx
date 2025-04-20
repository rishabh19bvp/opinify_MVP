import React from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { useForm } from '../hooks/useForm';
import { Button } from '../components/Button';
import TextInput from '../components/TextInput';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type ForgotPasswordScreenProps = StackScreenProps<AuthStackParamList, 'ForgotPassword'>;

interface ForgotPasswordFormValues {
  email: string;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { resetPassword, isLoading, error } = useAuthStore();
  
  const { values, handleChange, handleBlur, isValid } = useForm<ForgotPasswordFormValues>({
    email: '',
  });
  
  const handleResetPassword = async () => {
    if (!values.email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    
    try {
      await resetPassword(values.email);
      Alert.alert('Success', 'Password reset email sent. Please check your inbox.');
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email to reset your password</Text>
      
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
      
      <TextInput
        placeholder="Email"
        value={values.email}
        onChangeText={handleChange('email')}
        onBlur={() => handleBlur('email')}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Button
        title="Reset Password"
        onPress={handleResetPassword}
        loading={isLoading}
        disabled={!isValid || isLoading}
      />
      <View style={{ height: 20 }} />
      <Button
        title="Back to Login"
        onPress={() => navigation.navigate('Login')}
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;
