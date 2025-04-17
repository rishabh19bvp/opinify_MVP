import React from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { useForm } from '../hooks/useForm';
import { Button } from '../components/Button';
import TextInput from '../components/TextInput';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type RegisterScreenProps = StackScreenProps<AuthStackParamList, 'Register'>;

interface RegisterFormValues {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register, isLoading, error } = useAuthStore();
  
  const { values, handleChange, handleBlur, isValid } = useForm<RegisterFormValues>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  
  const handleRegister = async () => {
    if (!values.email || !values.username || !values.password || !values.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (values.password !== values.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    try {
      await register(values.email, values.password, values.username);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>
      
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
      
      <TextInput
        placeholder="Email"
        value={values.email}
        onChangeText={handleChange('email')}
        onBlur={handleBlur('email')}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        placeholder="Username"
        value={values.username}
        onChangeText={handleChange('username')}
        onBlur={handleBlur('username')}
        autoCapitalize="none"
      />
      
      <TextInput
        placeholder="Password"
        value={values.password}
        onChangeText={handleChange('password')}
        onBlur={handleBlur('password')}
        secureTextEntry
      />
      
      <TextInput
        placeholder="Confirm Password"
        value={values.confirmPassword}
        onChangeText={handleChange('confirmPassword')}
        onBlur={handleBlur('confirmPassword')}
        secureTextEntry
      />
      
      <Button
        title="Register"
        onPress={handleRegister}
        type="primary"
        disabled={isLoading}
      />
      
      <View style={styles.buttonSpacer} />
      
      <Button
        title="Already have an account? Login"
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
  buttonSpacer: {
    height: 20, // Add space between buttons
  },
});

export default RegisterScreen;
