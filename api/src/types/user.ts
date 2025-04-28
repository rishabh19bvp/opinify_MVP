import mongoose, { Document, Types } from 'mongoose';

export interface IUser {
  username: string;
  email: string;
  password: string;
  location: {
    latitude: number;
    longitude: number;
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isVerified?: boolean;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): Promise<string>;
}

export interface IUserModel extends mongoose.Model<IUserDocument> {
  // findByCredentials(email: string, password: string): Promise<IUserDocument | null>; // [Password logic archived: now handled by Firebase Auth]
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
  location: {
    latitude: number;
    longitude: number;
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  };
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  // password?: string; // [Password field archived: now handled by Firebase Auth]
  location?: {
    latitude?: number;
    longitude?: number;
  };
  profile?: Partial<{
    firstName: string;
    lastName: string;
    bio: string;
    avatarUrl: string;
  }>;
}
