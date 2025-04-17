module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          safe: true,
          allowUndefined: true,
          allowList: [
            'API_BASE_URL',
            'FIREBASE_API_KEY',
            'FIREBASE_AUTH_DOMAIN',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_STORAGE_BUCKET',
            'FIREBASE_MESSAGING_SENDER_ID',
            'FIREBASE_APP_ID',
            'FIREBASE_DATABASE_URL',
            'FIREBASE_CLIENT_ID',
            'EXPO_PUBLIC_API_BASE_URL'
          ]
        }
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
