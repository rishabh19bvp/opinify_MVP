import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useForm } from '../hooks/useForm';
import { Button } from '../components/Button';
import TextInput from '../components/TextInput';
import { colors } from '../utils/theme';
// import { signInAnonymouslyForTesting } from '../services/firebase';
// NOTE: signInAnonymouslyForTesting is deprecated. Use Firebase Auth directly for test logins if needed.
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { ProgressiveDisclosure } from '../components/ProgressiveDisclosure';
import { ResponsiveFeedback } from '../components/ResponsiveFeedback';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList>;
};

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, isLoading, error } = useAuthStore();
  const [testError, setTestError] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const { values, handleChange, handleBlur, isValid, errors } = useForm<LoginFormValues>(
    { email: '', password: '' },
    {
      email: (value) => {
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address';
        }
        return null;
      },
      password: (value) => {
        if (!value || value.length < 6) {
          return 'Password must be at least 6 characters';
        }
        return null;
      }
    }
  );

  const handleLogin = async () => {
    if (!values.email || !values.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(values.email, values.password);
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Error', 'Invalid email or password');
    }
  };



  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

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
          error={errors.email}
        />

        <TextInput
          placeholder="Password"
          value={values.password}
          onChangeText={handleChange('password')}
          onBlur={handleBlur('password')}
          secureTextEntry
          error={errors.password}
        />

        <ResponsiveFeedback
          onAction={handleLogin}
          disabled={!isValid || isLoading}
        >
          <Button
            title="Sign In"
            onPress={handleLogin}
            type="primary"
            disabled={!isValid || isLoading}
          />
        </ResponsiveFeedback>


        <View style={styles.buttonContainer}>
          <Button
            title="Register"
            onPress={() => navigation.navigate('Register')}
            type="secondary"
          />

          <Button
            title="Forgot Password?"
            onPress={() => navigation.navigate('ForgotPassword')}
            type="secondary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  subtitleSecondary: {
    fontSize: 16,
    color: colors.grey600,
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 15,
  },
  errorText: {
    color: colors.danger,
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 16,
    gap: 8,
    justifyContent: 'center',
    textAlign: 'center',
    marginVertical: 10,
    width: '100%',
  },
});

export default LoginScreen;
