export const config = {
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.29.53:3001',
    timeout: 10000,
  },
  news: {
    maxArticles: 100,
    cacheTime: 3600000, // 1 hour in milliseconds
  },
};
