# 📊 Polls Page - Technical Specification

## Overview
The Polls page serves as the default landing page for Opinify, displaying community polls based on the user's location. It enables citizens to vote on local issues and engage in discussions about community problems.

## Purpose
- Display location-based community polls
- Enable users to vote on local issues
- Facilitate community engagement through polls
- Connect users to discussion channels for voted polls

## User Flow
1. User opens the app and lands on the Polls page
2. Default view shows polls filtered by user's current location
3. User can change location via location selector
4. User can filter/sort polls by Latest, Trending, or Most Discussed
5. User can search for specific polls
6. User taps on a poll to view details and vote
7. After voting, user can join the related discussion channel

## UI Components

### Main Screen Components
- **Header Section**
  - Title ("Community Polls")
  - Search bar
  - Location selector (dropdown/modal)

- **Filters Section**
  - Horizontal scrollable chips
  - Filter options: "Latest", "Trending", "Most Discussed"
  - Visual indication of selected filter

- **Polls Feed**
  - Scrollable list of poll cards
  - Pull-to-refresh functionality
  - Loading indicator for pagination/initial load

### Poll Card Components
- **Header Section**
  - Title
  - Brief description
  - Timestamp
  - Optional: Creator info

- **Poll Options Section**
  - List of voting options
  - Progress bars showing current results
  - Vote counts/percentages

- **Action Section**
  - "Vote" button (for unvoted polls)
  - "View Results" button (for voted polls)
  - "Join Discussion" button (after voting)
  - Optional: Share button

## Data Structure

```typescript
interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: string; // ISO date string
  createdBy: {
    id: string;
    name: string;
  };
  location: {
    name: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  category?: string;
  tags?: string[];
  discussionChannelId?: string;
  metrics: {
    views: number;
    participationRate: number; // percentage of viewers who voted
    discussionCount: number; // number of messages in discussion channel
  };
  userVoted?: boolean; // if the current user has voted
  userVotedOption?: string; // id of the option the user voted for
}
```

## API Integration

### Endpoints to Implement
- `GET /api/polls` - Fetch polls with filters
  - Query params: 
    - `location`: string (location name or coordinates)
    - `sort`: 'latest' | 'trending' | 'most-discussed'
    - `search`: string (optional)
    - `page`: number (pagination)
    - `limit`: number (items per page)

- `GET /api/polls/:id` - Fetch single poll details

- `POST /api/polls/:id/vote` - Submit a vote
  - Body: `{ optionId: string }`

- `GET /api/polls/:id/discussion` - Get discussion channel for a poll

### Mock Data Structure
For development, use mock data that follows the Poll interface structure with realistic content for testing all UI states.

## State Management

### Local State
- Selected filter/sort option
- Search query
- Loading states

### Global State (Zustand)
- User location
- User voted polls
- Polls feed cache

## Features to Implement

### Phase 1 (MVP)
- Basic polls feed with mock data
- Filter/sort functionality
- Search functionality
- Voting mechanism
- Basic results display

### Phase 2
- Location-based filtering
- API integration with backend
- Discussion channel integration
- Poll sharing functionality

### Phase 3
- Real-time poll updates
- Push notifications for trending polls
- Analytics for poll engagement
- User-created polls integration

## Integration Points
- **Location Services**: Integrate with device location
- **Discussion Channels**: Connect polls to discussion channels
- **User Authentication**: Track user votes and participation
- **Push Notifications**: Alert users about trending polls

## Accessibility Considerations
- Screen reader support for poll content
- Appropriate contrast for text readability
- Scalable text for users with visual impairments
- Alternative input methods for voting

## Performance Optimization
- Lazy loading poll cards
- Pagination for polls feed
- Caching strategies for frequently accessed polls
- Optimized progress bar rendering

## Testing Scenarios
- Test with different location settings
- Test filter/sort functionality
- Test voting mechanism
- Test discussion channel integration
- Test with various screen sizes

---

## Implementation Notes
- Use React Native Paper components for consistent UI
- Implement proper error handling for API failures
- Consider implementing a poll service layer for data fetching
- Use skeleton loaders for better UX during loading states
- Ensure voting mechanism has proper validation to prevent duplicate votes
