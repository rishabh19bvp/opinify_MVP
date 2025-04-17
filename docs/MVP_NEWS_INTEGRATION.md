# Opinify MVP News Integration

## Overview
This document outlines the approach for integrating news content into the Opinify MVP using free resources, specifically the GNews API. The news integration will provide users with location-relevant news while working within the constraints of free API tiers.

## GNews API Integration

### API Details
- **Provider**: GNews API (https://gnews.io/)
- **Free Tier Limits**: 100 requests per day
- **Response Format**: JSON
- **Available Endpoints**:
  - Top Headlines
  - Search
  - News by Topic
  - News by Country

### Implementation Strategy

#### API Key Management
- Store API key in environment variables
- Implement key rotation capability for future expansion

#### Rate Limit Handling
- Track daily API usage in database
- Implement caching to reduce redundant calls
- Provide fallback content when limits are reached

#### Request Optimization
- Batch news requests at scheduled intervals
- Cache results for frequently accessed queries
- Implement staggered refresh for different news categories

## News Model

### Schema Design
```typescript
interface NewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: Date;
  source: {
    name: string;
    url: string;
  };
  relevanceScore?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  category?: string;
  tags?: string[];
  reactions?: {
    likes: number;
    shares: number;
    comments: number;
  };
}
```

### Geospatial Features
- Add location data to news articles when available
- Implement relevance scoring based on:
  - Proximity to user
  - Freshness of content
  - User preferences

## API Endpoints

### News Retrieval
- `GET /api/news` - Get paginated news feed
- `GET /api/news/nearby` - Get location-based news
- `GET /api/news/:id` - Get specific news article
- `GET /api/news/category/:category` - Get news by category

### User Interactions
- `POST /api/news/:id/react` - React to news (like, share)
- `POST /api/news/:id/comment` - Comment on news
- `GET /api/news/:id/comments` - Get comments for news

## Caching Strategy

### Implementation
- Use in-memory cache for frequent queries
- Implement Redis if usage grows (future consideration)
- Set appropriate TTL (Time To Live) for different content types:
  - Breaking news: 15 minutes
  - Regular news: 1 hour
  - Archived news: 24 hours

### Cache Invalidation
- Scheduled refresh for time-sensitive content
- Manual invalidation for content updates
- Partial cache updates for user interactions

## Fallback Mechanisms

### When API Limits Are Reached
- Serve cached content with clear timestamp indicators
- Display static curated content for common topics
- Implement user-generated content sections
- Show clear messaging about refresh timing

### Offline Support
- Cache essential news for offline access
- Implement background sync for reactions and comments
- Prioritize local news when coming back online

## Testing Strategy

### Unit Tests
- Test API client with mocked responses
- Validate caching mechanisms
- Test rate limit handling

### Integration Tests
- Verify GNews API integration
- Test geospatial news filtering
- Validate user interaction flows

### Performance Tests
- Measure response times with various cache states
- Test system behavior near API limits
- Validate fallback mechanisms

## Monitoring and Analytics

### Key Metrics
- Daily API usage tracking
- Cache hit/miss ratio
- User engagement with news content
- Performance metrics for news-related queries

### Alerts
- API limit approaching threshold
- Unusual cache miss patterns
- Elevated response times

## Future Enhancements (Post-MVP)

### Multiple News Sources
- Integrate additional news APIs for redundancy
- Implement news aggregation from multiple sources
- Develop custom web scraping for specific sources

### Advanced Features
- Personalized news recommendations
- Topic-based subscriptions
- Advanced content filtering
- Natural language processing for relevance scoring
