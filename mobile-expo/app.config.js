export default ({ config }) => ({
  ...config,
  name: "Opinify",
  slug: "opinify",
  version: "http://192.168.29.53:632150",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#4A90E2"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true
      },
      NSLocationWhenInUseUsageDescription: "Opinify needs access to your location to show relevant polls and news."
    },
    bundleIdentifier: "com.anonymous.opinify"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#4A90E2"
    },
    permissions: [
      "ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION"
    ],
    package: "com.anonymous.opinify"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Opinify needs access to your location to show relevant polls and news."
      }
    ]
  ],
  extra: {
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    EXPO_PUBLIC_FIREBASE_DATABASE_URL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL
  }
});
