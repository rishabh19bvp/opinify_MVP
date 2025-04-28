import mongoose, { Document, Types } from 'mongoose';
import { IUser } from './user';

export interface IPoll {
  title: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  options: {
    text: string;
    count: number;
  }[];
  creator: string; // firebaseUid
  expiresAt: Date;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'expired' | 'deleted';
  category?: string;
  tags?: string[];
}

export interface IPollDocument extends IPoll, Document {
  calculateDistance(lat: number, lng: number): number;
  isExpired(): boolean;
  canVote(userId: string): Promise<boolean>;
}

export interface IPollModel extends mongoose.Model<IPollDocument> {
  findByLocation(lat: number, lng: number, radius: number): Promise<IPollDocument[]>;
  findNearbyPolls(lat: number, lng: number, radius: number): Promise<IPollDocument[]>;
  findByCreator(creatorId: Types.ObjectId): Promise<IPollDocument[]>;
  findByCategory(category: string): Promise<IPollDocument[]>;
}

export interface CreatePollInput {
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  options: {
    text: string;
  }[];
  expiresAt: Date;
  category?: string;
  tags?: string[];
}

export interface UpdatePollInput {
  title?: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  options?: {
    id: string;
    text: string;
  }[];
  expiresAt?: Date;
  category?: string;
  tags?: string[];
}
