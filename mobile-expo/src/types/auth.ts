// Define our custom user type with only the fields we need
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  photoURL?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  };
}

export interface AuthResponse {
  success: boolean;
  user: AuthUser | null;
  token?: string;
  error?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  updateUser: (user: AuthUser | null, token: string | null) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  getToken: () => Promise<string | null>;
  checkAuthStatus: () => Promise<boolean>;
}
