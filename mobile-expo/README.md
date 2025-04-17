# Opinify Mobile App (Expo Version)

This is the Expo version of the Opinify mobile application, which provides location-based polls, news, and discussions.

## Features

- **Authentication**: User registration, login, and password reset
- **Polls**: Create and vote on location-based polls
- **News**: View location-based news articles
- **Discussions**: Participate in location-based discussion channels
- **Location Services**: Geolocation for finding nearby content

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) with React Native
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Navigation**: [React Navigation](https://reactnavigation.org/)
- **Backend Integration**: Firebase Authentication, Firestore, and Realtime Database
- **API Client**: Axios
- **UI Components**: Custom components with Expo Vector Icons

## Project Structure

```
src/
├── api/               # API services for backend communication
├── components/        # Reusable UI components
├── hooks/             # Custom React hooks
├── navigation/        # Navigation configuration
├── screens/           # App screens
├── services/          # Firebase and other services
├── store/             # Zustand state stores
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and constants
```

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your Firebase configuration:
   ```
   # Firebase Configuration
   API_KEY=your_firebase_api_key
   AUTH_DOMAIN=your_firebase_auth_domain
   PROJECT_ID=your_firebase_project_id
   STORAGE_BUCKET=your_firebase_storage_bucket
   MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   APP_ID=your_firebase_app_id
   DATABASE_URL=your_firebase_database_url

   # API Configuration
   API_BASE_URL=http://localhost:5000/api
   ```

### Running the App

```bash
# Start the Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android simulator
npm run android

# Run on web
npm run web
```

## Development Notes

### Environment Variables

Environment variables are managed using `react-native-dotenv`. The type definitions for these variables are in `src/types/env.d.ts`.

### Firebase Integration

Firebase is integrated using the `firebase/compat` API for compatibility with Expo. Authentication state is managed using Zustand in the `authStore.ts` file.

### Location Services

Location services are implemented using Expo's Location API. The location state is managed in the `locationStore.ts` file.

## Migrating from React Native CLI

This project was migrated from a React Native CLI project to Expo. The main changes include:

1. Using Expo-compatible Firebase packages
2. Replacing native modules with Expo SDK equivalents
3. Updating the project structure to follow Expo conventions
4. Configuring the babel.config.js for environment variables

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
