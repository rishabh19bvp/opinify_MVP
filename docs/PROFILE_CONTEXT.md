# 👤 Profile Page - Technical Specification

## Overview
The Profile page displays user information, activity statistics, and account settings, allowing users to manage their Opinify experience and track their community engagement.

## Purpose
- Display user details and activity statistics
- Provide account management options
- Allow users to customize their app experience
- Show history of user's polls and votes

## User Flow
1. User navigates to the Profile tab from bottom navigation
2. User views their profile information and statistics
3. User can edit their profile details
4. User can adjust app settings and preferences
5. User can view their activity history
6. User can manage account security options

## UI Components

### Main Screen Components
- **Header Section**
  - User avatar/photo
  - Username/display name
  - Join date
  - Edit Profile button

- **Statistics Section**
  - Polls created count
  - Polls voted on count
  - Discussion participation count
  - Visual charts/graphs (optional)

- **Activity History Section**
  - Tabs for "Created Polls" and "Voted Polls"
  - Scrollable list of poll cards
  - Timestamps for each activity

- **Settings Section**
  - Default location settings
  - Notification preferences
  - Privacy controls
  - Theme/appearance options (optional)

- **Account Section**
  - Change password option
  - Linked accounts (optional)
  - Logout button
  - Delete account option

### Edit Profile Modal/Screen
- Form for editing user details
- Avatar upload/change option
- Save/Cancel buttons
- Validation feedback

## Data Structure

```typescript
interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  avatar?: string;
  joinDate: string; // ISO date string
  defaultLocation: {
    name: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  stats: {
    pollsCreated: number;
    pollsVoted: number;
    discussionsJoined: number;
    discussionMessages: number;
  };
  preferences: {
    notifications: {
      pollResponses: boolean;
      newDiscussionMessages: boolean;
      localAlerts: boolean;
    };
    privacy: {
      showVotingHistory: boolean;
      anonymousVoting: boolean;
      anonymousDiscussions: boolean;
    };
    theme?: 'light' | 'dark' | 'system';
  };
}

interface ActivityItem {
  id: string;
  type: 'poll_created' | 'poll_voted' | 'discussion_joined';
  title: string;
  timestamp: string; // ISO date string
  details: {
    pollId?: string;
    optionVoted?: string;
    channelId?: string;
  };
}
```

## API Integration

### Endpoints to Implement
- `GET /api/users/profile` - Fetch user profile

- `PUT /api/users/profile` - Update user profile
  - Body: Updated profile fields

- `GET /api/users/activity` - Fetch user activity
  - Query params: 
    - `type`: 'created' | 'voted' | 'all'
    - `page`: number (pagination)
    - `limit`: number (items per page)

- `PUT /api/users/preferences` - Update user preferences
  - Body: Updated preferences object

- `PUT /api/users/password` - Change password
  - Body: `{ currentPassword: string, newPassword: string }`

- `DELETE /api/users/account` - Delete user account
  - Body: `{ password: string }`

## State Management

### Local State
- Edit mode status
- Form values for profile editing
- Active tab selection
- Loading states

### Global State (Zustand)
- User profile data
- Authentication status
- App preferences

## Features to Implement

### Phase 1 (MVP)
- Basic profile display
- Activity statistics
- Simple settings toggles
- Password change functionality

### Phase 2
- Activity history with filtering
- Enhanced statistics with visualizations
- Profile image upload
- Default location management

### Phase 3
- Theme customization
- Privacy controls
- Data export option
- Account linking (social logins)

## Integration Points
- **Authentication System**: User credentials and security
- **Poll System**: Track created and voted polls
- **Discussion System**: Track participation metrics
- **Location Services**: Manage default location
- **Notification System**: Manage notification preferences

## Accessibility Considerations
- Screen reader support for all profile sections
- Keyboard navigation for settings toggles
- Clear labeling for all interactive elements
- Sufficient color contrast for statistics displays

## Performance Optimization
- Lazy loading activity history
- Caching profile data for offline access
- Optimized image handling for avatars
- Efficient preference updates

## Testing Scenarios
- Test profile editing with various inputs
- Test preference toggles and their effects
- Test activity history filtering
- Test with different authentication states

---

## Implementation Notes
- Use React Native Paper components for consistent UI
- Implement proper form validation for profile editing
- Consider using a confirmation dialog for critical actions (delete account)
- Use secure storage for sensitive user information
- Implement optimistic UI updates for toggle switches
- Consider using skeleton loaders for profile data loading
