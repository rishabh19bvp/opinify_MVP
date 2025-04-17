# News API Flow Documentation

## Overview
This document describes the flow for fetching news articles in the Opinify application, from retrieving data via an external API, storing it in the database, and serving it to the frontend. The same architectural pattern will be used for user data as well.
- The application uses NewsAPI.org as the external news provider.

## Current Flow

### 1. Fetch News from External API
- The backend server fetches news articles from the NewsAPI.org API.
- The backend handles API authentication, error handling, and data transformation.

### 2. Store News in Database
- Fetched news articles are processed and saved in the MongoDB database.
- Duplicate articles are avoided by checking for existing URLs.
- Tags and metadata are extracted and stored for each article.

### 3. Serve News to Frontend
- The frontend (mobile/web app) requests news articles from the backend API endpoints (e.g., `/api/news/headlines`).
- The backend retrieves news articles from the database and returns them to the frontend in a standardized format.

## Notes
- **Sorting by category and reactions is NOT currently implemented.** All articles are fetched and served as-is.
- **Reactions (likes/shares) and category-based filtering are planned for future releases.**
- **The same flow will be used for users:**
  - User data will be fetched or created via the backend API.
  - The backend will store user data in the database.
  - User information will be served to the frontend as needed.

## Diagram

```
[External News API] --fetch--> [Backend Service] --store--> [MongoDB Database] --serve--> [Frontend App]
```

## Example Endpoints
- `GET /api/news/headlines` — Fetch top headlines for the frontend
- `GET /api/news/search?q=keyword` — Search news articles

## Future Improvements
- Add sorting/filtering by category
- Implement reactions (likes, shares) and allow sorting/filtering by these fields
- Enhance caching and error handling

---
_Last updated: 2025-04-15_
