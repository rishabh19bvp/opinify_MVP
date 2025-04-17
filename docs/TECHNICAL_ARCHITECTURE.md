# Opinify Technical Architecture Documentation

## Project Architecture Overview

Opinify is a comprehensive social good platform designed to facilitate community engagement through polls, news updates, and discussions around local issues. The project follows a modern mobile-first architecture with a clear separation between frontend and backend components.

The application is built using Expo (React Native) for the frontend mobile application and Express.js (Node.js) for the backend API services. The codebase follows a modular architecture with distinct separation of concerns:

1. **Frontend (Mobile)**: A React Native application built with Expo, using Expo Router for navigation and Zustand for state management.

2. **Backend (API)**: A Node.js/Express.js server that provides RESTful API endpoints, with MongoDB as the database, and JWT for authentication.

3. **State Management**: Zustand-based store with a slice pattern for managing different domains (auth, polls, news, discussions).

4. **Services Layer**: Handles communication between the frontend and backend through HTTP requests.

### Directory Structure Overview

```
opinify/
├── api/                  # Backend Express.js server
│   └── src/              # Server source code
├── app/                  # Expo Router app directory
│   └── (tabs)/           # Main application tabs
├── assets/               # Static assets like images and fonts
├── components/           # Reusable UI components
├── constants/            # Application constants and configurations
├── docs/                 # Project documentation
├── hooks/                # Custom React hooks
├── mobile/               # Mobile-specific code
│   └── src/              # Mobile source code with services and hooks
├── scripts/              # Utility scripts
├── services/             # Shared service interfaces
├── store/                # Zustand state management
│   └── slices/           # State slices by domain
└── types/                # TypeScript type definitions
```

## Folder-by-Folder, File-by-File Breakdown

### `/app`
Contains the Expo Router configuration which serves as the navigation system for the mobile application.

- **`_layout.tsx`**: Root layout component that defines the app's theme, fonts, and main navigation structure.
- **`(tabs)/`**: Contains the main tab navigator and screen components.
  - **`_layout.tsx`**: Tab navigation configuration.
  - **`index.tsx`**: Home screen (Polls page).
  - **`news.tsx`**: News feed screen.
  - **`add-poll.tsx`**: Create new poll screen.
  - **`discussions.tsx`**: Chat discussions screen.
  - **`explore.tsx`**: Explore nearby content screen.
  - **`profile.tsx`**: User profile screen.

### `/store`
Implements the Zustand state management system with a slice pattern.

- **`index.ts`**: Main store configuration that combines all slices and configures persistence.
- **`types.ts`**: TypeScript interfaces for the store state.
- **`slices/`**:
  - **`authSlice.ts`**: Authentication state and actions (login, register, logout).
  - **`pollsSlice.ts`**: Polls state and actions (fetch, filter, vote).
  - **`newsSlice.ts`**: News state and actions (fetch, filter, react).
  - **`discussionsSlice.ts`**: Discussions state and actions (channels, messages).
  - **`appSlice.ts`**: App settings and user preferences.

### `/mobile`
Contains mobile-specific implementation details.

- **`src/`**:
  - **`config/`**: Configuration constants for the mobile app.
  - **`hooks/`**: Mobile-specific custom hooks.
  - **`services/`**: Service implementation for API communication:
    - **`authService.ts`**: Handles authentication API requests.
    - **`newsService.ts`**: Manages news-related API requests.
    - **`locationService.ts`**: Provides location-based functionalities.
    - **`pollsService.ts`**: Manages poll-related API requests.
    - **`discussionsService.ts`**: Handles real-time chat functionality.
  - **`types/`**: TypeScript interfaces for mobile components.

### `/api`
Backend Express.js server that provides REST API endpoints.

- **`src/`**:
  - **`app.ts`**: Express application setup.
  - **`server.ts`**: Server initialization and startup.
  - **`config/`**: Environment and app configuration.
  - **`controllers/`**: Route handlers for API endpoints.
    - User, polls, news, discussions, and location controllers.
  - **`middleware/`**: Express middleware for authentication, error handling, etc.
  - **`models/`**: MongoDB schema definitions.
    - User, Poll, News, Discussion, and Channel models.
  - **`routes/`**: API route definitions.
    - Auth, polls, news, discussions, and user routes.
  - **`services/`**: Business logic and data manipulation.
  - **`types/`**: TypeScript interfaces for backend.
  - **`utils/`**: Utility functions and helpers.

### `/components`
Reusable UI components that are shared across screens.

### `/constants`
Application-wide constants including API endpoints, theme values, and feature flags.

### `/hooks`
Custom React hooks for shared functionality across components.

### `/docs`
Project documentation including implementation roadmaps and feature contexts.

## Execution Flow

### Application Initialization

1. **Entry Point**: The application starts at `app/_layout.tsx` where Expo Router initializes.
2. **Font Loading**: Fonts are loaded and the splash screen is displayed until loading completes.
3. **Theme Setup**: The application theme (light/dark) is configured based on user preferences.
4. **Navigation Structure**: The main tab navigation is set up with routes to all major screens.

### Authentication Flow

1. **Initial Check**: On app startup, the auth state is checked using tokens stored in AsyncStorage.
2. **Token Refresh**: If tokens exist but are expired, refresh tokens are used to get new access tokens.
3. **Login/Register**: User credentials are sent to the backend, which returns JWT tokens.
4. **Token Storage**: Access and refresh tokens are stored securely using AsyncStorage.
5. **Authenticated State**: The app updates the auth state in Zustand store, enabling authenticated views.

### Data Flow (Using Polls as Example)

1. **User Interaction**: User navigates to the Polls tab or interacts with poll content.
2. **Store Action Dispatch**: Actions like `fetchPolls()` or `votePoll()` are called from the UI.
3. **Service Layer**: The action calls the corresponding service (e.g., `pollsService.fetchNearbyPolls()`).
4. **API Request**: The service makes authenticated HTTP requests to the backend API.
5. **Backend Processing**: The API controller processes the request, interacts with the database, and returns results.
6. **State Update**: The response is processed and the Zustand store is updated with new data.
7. **UI Update**: React components re-render based on the updated store state.

### Real-time Flow (Discussions)

1. **Socket Connection**: When entering discussions, a WebSocket connection is established using Socket.io.
2. **Channel Subscription**: Users join specific channels based on polls they've interacted with.
3. **Message Handling**: Incoming messages are received via the socket and stored in the discussions slice.
4. **Message Sending**: Outgoing messages are sent through the socket and also reflected in the local state.

## Technical Stack Specifics

### Frontend

- **React Native / Expo**: Provides a cross-platform mobile development framework.
- **Expo Router**: File-based routing system for navigation between screens.
- **Zustand**: Lightweight state management with a simple API and efficient updates.
- **React Native Paper**: Material Design components for consistent UI.
- **Axios**: HTTP client for API communication.
- **TypeScript**: Static typing for improved code quality and developer experience.
- **AsyncStorage**: Persistent local storage for user data and settings.
- **Socket.io Client**: Real-time communication for discussions feature.

### Backend

- **Node.js / Express.js**: Server-side JavaScript runtime and web framework.
- **MongoDB**: NoSQL database for flexible data storage.
- **JWT**: JSON Web Tokens for secure authentication.
- **Socket.io**: WebSocket library for real-time bidirectional communication.
- **TypeScript**: Type safety for backend code.
- **Axios**: Used for external API requests (e.g., news services).

### Development Tools

- **Expo CLI**: Command-line tools for Expo development.
- **standard-version**: Versioning and changelog generation.
- **Jest**: Testing framework for unit and integration tests.

## Change/Scale Roadmap

As Opinify grows, the following architectural changes should be considered:

### Short-term Scalability

1. **API Modularization**: Further break down API routes and controllers by feature domain.
2. **Caching Layer**: Implement Redis for caching frequently accessed data like polls and news.
3. **Server-side Pagination**: Add more robust pagination for lists of polls, news, and discussions.
4. **Background Jobs**: Implement a job queue (like Bull) for handling tasks like notifications and analytics.

### Mid-term Scalability

1. **Microservices Architecture**:
   - Split the monolithic API into separate services for auth, polls, news, and discussions.
   - Implement an API gateway for routing requests to appropriate services.

2. **Data Optimization**:
   - Implement database sharding for location-based data.
   - Add read replicas for improved read performance.

3. **Code Splitting**:
   - Move shared business logic to a separate core library.
   - Implement proper code splitting in the frontend for faster load times.

### Long-term Scalability

1. **Geospatial Optimization**:
   - Implement geospatial indexing and specialized databases for location queries.
   - Create location-based sharding for global scalability.

2. **Analytics Pipeline**:
   - Build a separate analytics service for tracking user engagement.
   - Implement data warehousing for business intelligence.

3. **Content Delivery Network**:
   - Use CDN for static assets and possibly edge functions for location-sensitive operations.

## Suggested Improvements

### Architecture Improvements

1. **Service Layer Enhancement**:
   - Create a more robust service layer with proper error handling and retry logic.
   - Implement a service registry pattern for better service discovery.

2. **State Management Refinement**:
   - Add more granular selectors in Zustand store to prevent unnecessary re-renders.
   - Implement optimistic updates for better user experience.

3. **API Design**:
   - Move to a more RESTful API design with consistent endpoint naming.
   - Consider GraphQL for more flexible data fetching on the client.

### Code Quality Improvements

1. **Testing Strategy**:
   - Increase test coverage across all components.
   - Implement E2E testing with Detox or similar tools.

2. **Code Organization**:
   - Standardize folder structure across all feature domains.
   - Implement feature-based organization rather than type-based.

3. **Documentation**:
   - Add JSDoc comments to all functions and components.
   - Create API documentation using Swagger or similar tools.

### Performance Improvements

1. **Mobile Optimization**:
   - Implement better list virtualization for long scrolling lists.
   - Optimize image loading and caching strategies.

2. **State Persistence**:
   - Be more selective about what state is persisted to avoid storage bloat.
   - Implement state migration strategies for app updates.

3. **Offline Support**:
   - Add robust offline capabilities using a combination of local storage and service workers.
   - Implement conflict resolution for offline-created content.

This technical documentation provides a comprehensive overview of the Opinify codebase, its architecture, and future growth paths. The application's thoughtful design around state management and service abstraction provides a solid foundation for scaling and expanding its features.
