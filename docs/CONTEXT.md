# 🌟 Social Good Cause Application - Technical Overview

## 🌍 Overview
A platform empowering citizens to:
- Raise awareness about local issues
- Vote on community problems through polls
- Engage in discussions for participatory decision-making and localized problem-solving

**Target Audience**: Citizens aged 18+ interested in civic engagement, local activism, and community development.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: `React Native` (iOS & Android)
- **Navigation**: `React Navigation`
- **UI Library**: `React Native Paper` or `Tailwind`
- **Geolocation**: `Expo-location` or `react-native-geolocation-service`

### Backend
- **Framework**: `Node.js` with `Express.js`
- **Database**: `MongoDB` (via `Mongoose`)
- **Authentication**: `JWT`-based system
- **Real-time Communication**: `Socket.io` or `Firebase`

### Others
- **Push Notifications**: `Firebase Cloud Messaging`
- **Location Services**: `Google Maps API` / `Mapbox`
- **News API**: Integration with local news API or RSS feeds

---

## 📱 Application Flow & Structure

### Bottom Navigation (Persistent Across All Pages)
1. **Polls Page**
2. **Search/News Page**
3. **Add Poll Page**
4. **Discussion Channels Page**
5. **Profile Page**

---

## 📊 1. Polls Page (Default Page)
**Purpose**: Display latest polls on community issues based on user's location.

**Main Features**:
- Location selector (default: user’s geolocation)
- Ongoing polls list with title, issue brief, timestamp, and poll results/options
- Sorting/Filtering: Latest, Trending, Most Discussed
- User Interaction: Tap to vote, post-vote option to "Join Discussion Channel"

**Wireframe Notes**:
- Poll card elements: Title, Brief description, Vote count/percentage, CTA button ("Vote" / "View Channel")

---

## 📰 2. Search/News Page
**Purpose**: Provide hyper-local news content and updates.

**Main Features**:
- Location selector
- Feed-style news articles list
- Categories: Local Alerts, Municipal News, Community Projects
- Features: Pull to refresh, Expand for full article, Optional reactions

**Wireframe Notes**:
- News item elements: Headline, Short preview, Timestamp, Source link/modal popup

---

## ➕ 3. Add Poll Page
**Purpose**: Allow users to add a new issue/poll.

**Fields**:
- Issue Title
- Description
- Location (auto-filled, editable)
- Poll Options (min. 2)

**Validation**:
- Character limits
- Optional duplicate check
- Submit button (disabled until fields are filled)

**Wireframe Notes**:
- Step-by-step form or single scrollable form
- Confirmation popup/modal before submission

---

## 💬 4. Discussion Channels Page
**Purpose**: Enable users to join channels related to polls they've voted on.

**Access Rule**:
- Must vote on poll to enter channel
- Prompt to vote if not done

**Main Features**:
- Channel list
- Chat interface
- Real-time chat, Mute notifications, Optional threaded replies

**Wireframe Notes**:
- Channel card: Issue title, Member count, Join/View button
- In-chat: Timestamp, Name alias (optional anonymity)

---

## 👤 5. Profile Page
**Purpose**: Display and edit user details.

**Fields**:
- Username
- Default Location
- Change Password (optional)
- Polls Created
- Polls Voted On

**Edit Features**:
- Change default location
- Opt-in/out of push notifications

**Wireframe Notes**:
- Top section: Avatar & name
- Stats/History section
- Edit Profile button

---

## 🛠 Notes for Developers
- **State Management**: Use `Redux` or `Zustand`
- **Modularity**: Each tab as its own navigation stack
- **Permissions**: User-friendly location permission handling
- **Accessibility**: Large tap areas, screen reader compatibility

---

## 🚀 Future Enhancements
- Voting analytics dashboard
- Gamification (badges)
- Verified sources for polls/news
- Multi-language support
- Anonymous user participation

---

## 📁 Project Structure
```
opinify/
├── mobile/                 # React Native App
│   ├── src/
│   │   ├── api/           # API client & endpoints
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── navigation/   # Navigation config
│   │   ├── screens/      # Screen components
│   │   ├── store/        # State management
│   │   ├── theme/        # UI theme constants
│   │   └── utils/        # Helper functions
│   ├── App.tsx
│   └── package.json
│
├── backend/               # Node.js Server
│   ├── src/
│   │   ├── config/       # Environment & app config
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   ├── app.js
│   └── package.json
│
└── docs/                 # Documentation
    └── CONTEXT.md        # Technical overview
```

## 💾 Database Schema

### User Collection
```typescript
{
  _id: ObjectId,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: { type: String, bcrypt: true },
  profile: {
    avatar: String,
    defaultLocation: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number]  // [longitude, latitude]
    },
    notificationPrefs: {
      push: Boolean,
      email: Boolean,
      digest: { type: String, enum: ['daily', 'weekly', 'none'] }
    }
  },
  stats: {
    pollsCreated: Number,
    pollsVoted: Number,
    commentsCount: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Poll Collection
```typescript
{
  _id: ObjectId,
  creator: { type: ObjectId, ref: 'User' },
  title: String,
  description: String,
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: [Number],
    address: String
  },
  options: [{
    _id: ObjectId,
    text: String,
    votes: Number
  }],
  status: { 
    type: String, 
    enum: ['active', 'closed', 'flagged'] 
  },
  metrics: {
    totalVotes: Number,
    viewCount: Number,
    commentCount: Number
  },
  tags: [String],
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Vote Collection
```typescript
{
  _id: ObjectId,
  pollId: { type: ObjectId, ref: 'Poll' },
  userId: { type: ObjectId, ref: 'User' },
  optionId: ObjectId,
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: [Number]
  },
  createdAt: Date
}
```

### Comment Collection
```typescript
{
  _id: ObjectId,
  pollId: { type: ObjectId, ref: 'Poll' },
  userId: { type: ObjectId, ref: 'User' },
  parentId: { type: ObjectId, ref: 'Comment' },
  content: String,
  status: { 
    type: String, 
    enum: ['active', 'hidden', 'flagged'] 
  },
  metrics: {
    likes: Number,
    replies: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### News Collection
```typescript
{
  _id: ObjectId,
  title: String,
  content: String,
  source: {
    name: String,
    url: String,
    logo: String
  },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: [Number],
    radius: Number  // coverage radius in meters
  },
  category: { 
    type: String, 
    enum: ['local', 'municipal', 'community'] 
  },
  metrics: {
    views: Number,
    reactions: {
      informative: Number,
      helpful: Number,
      important: Number
    }
  },
  status: { 
    type: String, 
    enum: ['active', 'archived'] 
  },
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
// Geospatial indexes
db.polls.createIndex({ "location": "2dsphere" })
db.news.createIndex({ "location": "2dsphere" })

// Performance indexes
db.votes.createIndex({ "pollId": 1, "userId": 1 }, { unique: true })
db.comments.createIndex({ "pollId": 1, "createdAt": -1 })
db.polls.createIndex({ "creator": 1, "status": 1 })
db.news.createIndex({ "category": 1, "publishedAt": -1 })
```

## 📋 Summary
This application serves as a local engagement and issue resolution hub, balancing awareness (news), action (polls), and interaction (discussion channels) with a user-friendly, mobile-first interface focused on community-driven impact. Developers should prioritize modularity and accessibility throughout the implementation process.