# Opinify MVP Technical Architecture Documentation

## Project Architecture Overview

Opinify MVP is a location-based social good platform designed to facilitate community engagement through polls, news updates, and discussions around local issues. The MVP is built using free resources from the web to minimize costs during initial development and testing.

The application follows a modern mobile-first architecture with a clear separation between frontend and backend components:

1. **Frontend (Mobile)**: A React Native application built with Expo, using Expo Router for navigation and Zustand for state management.

2. **Backend (API)**: A Node.js/Express.js server that provides RESTful API endpoints, with MongoDB Atlas (free tier) as the database, and JWT for authentication.

3. **Firebase Integration**: Utilizing Firebase free tier for web hosting, authentication, and limited real-time functionality.

4. **External APIs**: Integration with free APIs like GNews for content.

## Free Resources Utilized

### Backend Resources
- **Database**: MongoDB Atlas free tier (512MB storage)
- **Hosting**: Render.com free tier or Heroku free tier
- **API Integration**: GNews API (free tier - 100 requests/day)

### Frontend Resources
- **Hosting**: Firebase Hosting (free tier)
- **Authentication**: Firebase Authentication (free tier)
- **Storage**: Firebase Storage (free tier)
- **Analytics**: Firebase Analytics (free tier)

## MVP Limitations

### Features Not Implemented
- **Push Notifications**: Not included in MVP
- **Advanced Real-time Chat**: Limited functionality in MVP
- **Content Moderation**: Basic manual moderation only
- **Advanced Analytics**: Basic analytics only

### Technical Constraints
- **Database Limitations**: 
  - 512MB storage limit on MongoDB Atlas free tier
  - Limited connections and throughput
- **API Rate Limits**: 
  - GNews API: 100 requests per day
  - Other free APIs: Various rate limits
- **Hosting Limitations**:
  - Cold starts on free tier hosting
  - Limited computing resources
  - Bandwidth restrictions

## Directory Structure Overview

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

## Core Components

### Authentication System
- JWT-based authentication with Firebase Auth integration
- Secure token management with refresh token mechanism
- Role-based access control for admin functions

### Geospatial Polling System
- MongoDB geospatial indexing for location-based queries
- Efficient nearby poll discovery with distance-based relevance
- Vote validation and duplicate prevention

### News Integration
- GNews API integration with caching to manage rate limits
- Location-based news filtering
- Basic interaction features (reactions, comments)

### Limited Discussion Channels
- Basic real-time communication using Firebase Realtime Database
- Poll-associated discussion channels
- Simple message persistence

## Data Flow Optimization for Free Resources

### API Call Optimization
- Implement aggressive caching to reduce GNews API calls
- Batch database operations to reduce connection overhead
- Implement pagination with reasonable page sizes

### Database Query Optimization
- Limit returned fields to reduce document size
- Use compound indexes for common query patterns
- Implement TTL indexes for temporary data

### Frontend Optimization
- Implement lazy loading for images and content
- Use local storage for frequently accessed data
- Implement offline capabilities where possible

## Execution Flow

### Application Initialization
1. Load essential UI components and authentication state
2. Check for cached data before making API requests
3. Initialize Firebase services with minimal configuration

### Authentication Flow
1. Use Firebase Authentication for user management
2. Generate and manage JWT tokens for API access
3. Implement secure token refresh mechanism

### Data Flow (Polls Example)
1. Cache frequently accessed polls locally
2. Implement pagination for poll lists
3. Prioritize nearby polls based on user location
4. Optimize poll data structure for minimal storage

### News Flow
1. Cache news articles to minimize GNews API calls
2. Implement fallback content when API limits are reached
3. Prioritize local news based on relevance algorithms

## Future Scalability Considerations

When transitioning beyond the MVP and free resources, consider:

1. **Database Scaling**:
   - Upgrade to paid MongoDB Atlas tiers
   - Implement sharding for location-based data

2. **API Enhancements**:
   - Upgrade to paid API tiers for higher limits
   - Implement multiple news sources for redundancy

3. **Infrastructure Upgrades**:
   - Move to dedicated hosting for consistent performance
   - Implement CDN for static content delivery
   - Set up proper monitoring and alerting

4. **Feature Expansion**:
   - Implement push notifications
   - Enhance real-time capabilities
   - Add advanced analytics and reporting
   - Implement automated content moderation
