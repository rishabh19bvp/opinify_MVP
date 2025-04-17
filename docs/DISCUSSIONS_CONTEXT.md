# 💬 Discussions Page - Technical Specification

## Overview
The Discussions page provides access to chat channels related to polls that users have voted on, enabling community engagement and deliberation on local issues.

## Purpose
- Enable users to join discussion channels for polls they've voted on
- Facilitate community conversation about local issues
- Create a space for deliberative democracy and problem-solving
- Build connections between community members with shared interests

## User Flow
1. User navigates to the Discussions tab from bottom navigation
2. User sees a list of available discussion channels (based on polls they've voted on)
3. User selects a channel to join
4. If user hasn't voted on the related poll, they are prompted to vote first
5. User enters the chat interface for the selected channel
6. User can send messages, view other members' messages, and engage in conversation

## Access Rules
- Users must vote on a poll to access its discussion channel
- Non-voters are prompted to vote when attempting to access a channel
- Once voted, users have permanent access to the channel

## UI Components

### Main Screen Components
- **Header Section**
  - Title ("Discussion Channels")
  - Search bar for finding specific channels
  - Optional filter options

- **Channel List**
  - Scrollable list of channel cards
  - Visual indicators for unread messages
  - Sorting options (Recent Activity, Most Members, etc.)

### Channel Card Components
- **Header**
  - Channel title (same as poll title)
  - Member count
  - Activity status indicator

- **Content**
  - Brief description (from poll description)
  - Preview of latest message (if any)
  - Timestamp of latest activity

- **Action**
  - "Join" button (if not joined)
  - "View" button (if already joined)
  - Badge for unread messages

### Chat Interface Components
- **Header**
  - Channel title
  - Member count
  - Back button to return to channel list
  - Optional: Channel settings

- **Message List**
  - Scrollable list of messages
  - Timestamp for each message
  - User identification (name/avatar)
  - Message content with support for text and basic formatting

- **Input Section**
  - Text input field
  - Send button
  - Optional: Attachment button, emoji selector

## Data Structure

```typescript
interface Message {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string; // ISO date string
  isAnonymous: boolean;
  parentMessageId?: string; // for threaded replies
  reactions?: {
    [reactionType: string]: string[]; // array of userIds
  };
}

interface Channel {
  id: string;
  pollId: string;
  title: string;
  description: string;
  memberCount: number;
  lastActivity: string; // ISO date string
  lastMessage?: {
    content: string;
    userName: string;
    timestamp: string;
  };
  isJoined: boolean;
  unreadCount: number;
}
```

## API Integration

### Endpoints to Implement
- `GET /api/channels` - Fetch available channels (based on user's voted polls)
  - Query params: 
    - `sort`: 'recent' | 'popular' | 'unread'
    - `search`: string (optional)
    - `page`: number (pagination)

- `GET /api/channels/:id` - Fetch channel details

- `GET /api/channels/:id/messages` - Fetch messages for a channel
  - Query params:
    - `before`: timestamp (for pagination)
    - `limit`: number (messages per page)

- `POST /api/channels/:id/messages` - Send a new message
  - Body: `{ content: string, isAnonymous: boolean, parentMessageId?: string }`

- `PUT /api/channels/:id/join` - Join a channel

- `PUT /api/channels/:id/read` - Mark channel as read

### Real-time Communication
- Implement Socket.io or Firebase for real-time message updates
- Events to handle:
  - New message
  - User joined/left
  - Message reactions
  - Typing indicators

## State Management

### Local State
- Current channel
- Message input
- Loading states

### Global State (Zustand)
- Joined channels
- Unread message counts
- User preferences (anonymity, notifications)

## Features to Implement

### Phase 1 (MVP)
- Basic channel list
- Simple chat interface
- Access control based on poll voting
- Real-time messaging

### Phase 2
- Threaded replies
- Message reactions
- Typing indicators
- Rich text formatting

### Phase 3
- File/image sharing
- @mentions and notifications
- Channel moderation tools
- Analytics for engagement

## Integration Points
- **Poll System**: Check if user has voted on related poll
- **User Authentication**: Identify users in chat
- **Push Notifications**: Alert users about new messages
- **Real-time Database**: Enable live updates

## Accessibility Considerations
- Screen reader support for messages
- Keyboard navigation for chat interface
- Message timestamp formats that are screen reader friendly
- Alternative text for any images/attachments

## Performance Optimization
- Message pagination
- Efficient real-time connection management
- Message caching for offline access
- Optimized rendering for long chat histories

## Testing Scenarios
- Test access control (voted vs. non-voted users)
- Test real-time message delivery
- Test with high message volume
- Test offline behavior

---

## Implementation Notes
- Use React Native Paper components for consistent UI
- Implement proper error handling for message sending failures
- Consider implementing a message queue for offline support
- Use appropriate caching strategies for message history
- Ensure proper security rules for user-generated content
