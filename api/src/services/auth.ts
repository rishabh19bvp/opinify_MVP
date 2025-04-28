import { User, IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { z } from 'zod';
import mongoose from 'mongoose'; // Import mongoose

// Custom error classes for better error handling
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Input validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  // password: z.string()
  //   .min(8, 'Password must be at least 8 characters')
  //   .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  //   .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  //   .regex(/[0-9]/, 'Password must contain at least one number')
  //   .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
  // [Password validation archived: now handled by Firebase Auth]

  location: z.object({
    latitude: z.number()
      .min(-90, 'Invalid latitude')
      .max(90, 'Invalid latitude'),
    longitude: z.number()
      .min(-180, 'Invalid longitude')
      .max(180, 'Invalid longitude')
  }).optional(),
  profile: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    bio: z.string().max(200).optional(),
    avatarUrl: z.string().url().optional()
  }).optional()
});

export interface AuthResponse {
  success: boolean;
  user: Omit<IUser, 'password'> | null;
  token?: string;
  error?: string;
  message?: string;
}

export class AuthService {
  private static instance: AuthService;
  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private generateTokens(userId: string): { token: string; refreshToken: string } {
    try {
      const token = jwt.sign(
        { userId },
        config.jwt.secret as string,
        { 
          expiresIn: parseInt(config.jwt.expiresIn), 
          algorithm: 'HS256' 
        }
      );

      const refreshToken = jwt.sign(
        { userId },
        config.jwt.secret as string,
        { 
          expiresIn: parseInt(config.jwt.refreshExpiresIn), 
          algorithm: 'HS256' 
        }
      );

      return { token, refreshToken };
    } catch (error) {
      throw new AuthenticationError('Token generation failed');
    }
  }

  public async register(userData: any): Promise<AuthResponse> {
    try {
      // Validate input data
      const validatedData = registerSchema.parse(userData);

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: validatedData.email },
          { username: validatedData.username }
        ]
      });

      if (existingUser) {
        return {
          success: false,
          user: null,
          error: existingUser.email === validatedData.email ? 'Email already registered' : 'Username already taken',
          message: existingUser.email === validatedData.email ? 'This email is already registered.' : 'This username is already taken.'
        };
      }

      // Create new user
      const user = await User.create(validatedData);

      // Generate token
      const { token } = this.generateTokens((user as any)._id.toString());

      return {
        success: true,
        user: user.toObject() as Omit<IUser, 'password'>,
        token,
        message: 'Registration successful.'
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          user: null,
          error: 'Validation error',
          message: error.errors[0].message
        };
      }
      return {
        success: false,
        user: null,
        error: 'Server error',
        message: (error as Error).message
      };
    }
  }

  public async login(credentials: any): Promise<AuthResponse> {
    try {
      // Validate input data
      const validatedCredentials = loginSchema.parse(credentials);

      // Find user by email
      const user = await User.findOne({ email: validatedCredentials.email });
      if (!user) {
        return {
          success: false,
          user: null,
          error: 'Invalid credentials',
          message: 'No user found with this email.'
        };
      }

      // Password login is not supported; only Firebase Auth should be used
      return {
        success: false,
        user: null,
        error: 'Login with password is not supported. Use Firebase Auth.',
        message: 'Please use Firebase authentication to log in.'
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          user: null,
          error: 'Validation error',
          message: error.errors[0].message
        };
      }
      return {
        success: false,
        user: null,
        error: 'Server error',
        message: (error as Error).message
      };
    }
  }

  public async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret as string) as { userId: string };
      
      const user = await User.findOne({ firebaseUid: decoded.userId });
      
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      return user.toObject();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid or expired token');
      }
      throw error;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
