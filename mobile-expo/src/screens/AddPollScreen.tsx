import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import Constants from 'expo-constants';
import { initApi } from '../services/api';
import { useLocation } from '../hooks/useLocation';

const AddPollScreen: React.FC = () => {
  const { coordinates } = useLocation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{title?: string, description?: string}>({});

  // Options are always Yes/No
  const options = [
    { text: 'Yes' },
    { text: 'No' }
  ];

  const validate = () => {
    const newErrors: {title?: string, description?: string} = {};
    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!description.trim()) newErrors.description = 'Description is required.';
    return newErrors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    setErrors(errors);
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setLoading(true);
    try {
      // Use the same API logic as NewsScreen
      const apiBaseUrl = Constants.expoConfig?.extra?.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
      if (!apiBaseUrl) throw new Error('API base URL not configured');
      const { token } = require('../store/authStore').useAuthStore.getState();
      console.log('Current user token:', token);
      if (!token) {
        Alert.alert('Not Logged In', 'You must be logged in to create a poll.');
        setLoading(false);
        return;
      }
      const api = await initApi(apiBaseUrl);
      console.log('Creating poll with:', { title, description, options });
      if (!coordinates) {
        Alert.alert('Error', 'Location is required to create a poll');
        return;
      }

      // Set default expiresAt to 3 months from now
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);
      const response = await api.post('/api/polls', {
        title,
        description,
        options,
        location: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        },
        expiresAt: expiresAt.toISOString()
      });
      const data = response.data;
      if (data.success) {
        Alert.alert('Success', 'Poll created successfully!');
        setTitle(''); setDescription('');
      } else {
        Alert.alert('Error', data.error ? data.error.toString() : 'Failed to create poll');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <ScrollView contentContainerStyle={styles.bg} keyboardShouldPersistTaps="handled">
      <View style={styles.headerContainer}>
        <Text style={styles.bigHeader}>Create Poll</Text>
        <Text style={styles.subtitle}>Empower your community with a question!</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          placeholder="Poll title"
          value={title}
          onChangeText={text => { setTitle(text); if (errors.title) setErrors(e => ({...e, title: undefined})); }}
          autoCapitalize="sentences"
          placeholderTextColor="#b0b3b8"
          returnKeyType="next"
        />
        {errors.title
          ? <Text style={styles.errorText}>{errors.title}</Text>
          : <Text style={styles.helperText}>Short, clear, and to the point.</Text>}

        <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textarea, errors.description && styles.inputError]}
          placeholder="Describe your poll in detail"
          value={description}
          onChangeText={text => { setDescription(text); if (errors.description) setErrors(e => ({...e, description: undefined})); }}
          multiline
          numberOfLines={4}
          placeholderTextColor="#b0b3b8"
        />
        {errors.description
          ? <Text style={styles.errorText}>{errors.description}</Text>
          : <Text style={styles.helperText}>Add context for better engagement.</Text>}

        <Text style={styles.label}>Options</Text>
        <Text style={styles.optionsSubtitle}>All polls are Yes/No questions for clarity.</Text>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          activeOpacity={loading ? 1 : 0.7}
          onPress={loading ? undefined : handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Poll</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  required: {
    color: '#ff4d4f',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 13,
    marginBottom: 18,
    marginLeft: 2,
  },
  bg: {
    flexGrow: 1,
    backgroundColor: '#f6f7fb',
    paddingVertical: 32,
    paddingHorizontal: 16,
    minHeight: '100%',
  },
  headerContainer: {
    marginBottom: 18,
    alignItems: 'center',
  },
  bigHeader: {
    fontSize: 32,
    fontWeight: '800',
    color: '#222',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6d758f',
    textAlign: 'center',
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 24,
  },
  label: {
    fontWeight: '700',
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
    marginTop: 16,
    letterSpacing: 0.1,
  },
  helperText: {
    color: '#a1a7b3',
    fontSize: 13,
    marginBottom: 18,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#f6f7fb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#222',
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: '#e2e6ef',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: Platform.OS === 'android' ? 1 : 0,
  },
  inputError: {
    borderColor: '#ff4d4f',
    backgroundColor: '#fff6f6',
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 8,
    alignItems: 'center',
  },
  button: {
    marginTop: 32,
    backgroundColor: '#1665ff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#1665ff',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  optionsSubtitle: {
    color: '#789',
    fontSize: 13,
    marginBottom: 10,
    alignSelf: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  optionCard: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    paddingVertical: 18,
    paddingHorizontal: 30,
    marginHorizontal: 8,
    shadowColor: '#e3eafc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    minWidth: 90,
  },
  yesCard: {
    backgroundColor: '#3182ce', // Opinify blue (same as yesBar)
  },
  noCard: {
    backgroundColor: '#e53e3e', // Opinify red (same as noBar)
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4fa3',
    letterSpacing: 0.5,
  },
});

export default AddPollScreen;
