export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: Array<{
    id: string;
    text: string;
    voteCount: number;
  }>;
  creatorId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  expiresAt: string;
  totalVotes: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: {
    id: string;
    name: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  publishedAt: string;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  creatorId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  comments: Array<{
    id: string;
    content: string;
    creatorId: string;
    createdAt: string;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;
}

export interface ApiError {
  status: number;
  message: string;
  details?: any;
}
