import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { config } from '../config';
import fs from 'fs';

// Initialize Firebase Admin SDK
let firebaseApp: any;
let firebaseDb: any;

/**
 * Initialize Firebase connection
 */
export const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (firebaseApp) {
      return firebaseDb;
    }

    // Get service account path from config
    const serviceAccountPath = config.firebase.serviceAccountPath;
    
    // Check if service account file exists
    if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
      console.warn('Firebase service account file not found, using demo mode');
      return null;
    }

    // Load service account
    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, 'utf8')
    ) as ServiceAccount;

    // Initialize app
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: config.firebase.databaseURL
    });

    // Get database reference
    firebaseDb = getDatabase(firebaseApp);
    
    console.log('Firebase Realtime Database initialized');
    
    return firebaseDb;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
};

/**
 * Firebase Realtime Database Service
 */
export class FirebaseService {
  private db: any;
  private channelsRef: any;
  
  constructor() {
    // Initialize Firebase if not already done
    this.db = initializeFirebase();
    
    if (this.db) {
      this.channelsRef = this.db.ref('channels');
    }
  }
  
  /**
   * Check if Firebase is connected
   */
  isConnected(): boolean {
    return !!this.db;
  }
  
  /**
   * Create a new channel in Firebase
   */
  async createChannel(channelId: string, channelData: any): Promise<boolean> {
    if (!this.isConnected()) {
      console.warn('Firebase not connected, skipping createChannel');
      return false;
    }
    
    try {
      await this.channelsRef.child(channelId).set({
        ...channelData,
        messages: [],
        lastUpdated: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error creating channel in Firebase:', error);
      return false;
    }
  }
  
  /**
   * Add a message to a channel
   */
  async addMessage(channelId: string, message: any): Promise<string | null> {
    if (!this.isConnected()) {
      console.warn('Firebase not connected, skipping addMessage');
      return null;
    }
    
    try {
      const messagesRef = this.channelsRef.child(`${channelId}/messages`);
      const newMessageRef = messagesRef.push();
      
      await newMessageRef.set({
        ...message,
        timestamp: Date.now()
      });
      
      // Update last activity
      await this.channelsRef.child(`${channelId}/lastUpdated`).set(Date.now());
      
      return newMessageRef.key;
    } catch (error) {
      console.error('Error adding message to Firebase:', error);
      return null;
    }
  }
  
  /**
   * Get messages from a channel with pagination
   */
  async getMessages(channelId: string, limit: number = 50, startAt?: string): Promise<any[]> {
    if (!this.isConnected()) {
      console.warn('Firebase not connected, skipping getMessages');
      return [];
    }
    
    try {
      let query = this.channelsRef.child(`${channelId}/messages`).orderByKey().limitToLast(limit);
      
      if (startAt) {
        query = query.endAt(startAt);
      }
      
      const snapshot = await query.once('value');
      const messages: any[] = [];
      
      snapshot.forEach((childSnapshot: any) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      return messages.reverse();
    } catch (error) {
      console.error('Error getting messages from Firebase:', error);
      return [];
    }
  }
  
  /**
   * Update channel metadata
   */
  async updateChannel(channelId: string, data: any): Promise<boolean> {
    if (!this.isConnected()) {
      console.warn('Firebase not connected, skipping updateChannel');
      return false;
    }
    
    try {
      // Don't update messages field directly
      const { messages, ...updateData } = data;
      
      await this.channelsRef.child(channelId).update({
        ...updateData,
        lastUpdated: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating channel in Firebase:', error);
      return false;
    }
  }
  
  /**
   * Delete a channel
   */
  async deleteChannel(channelId: string): Promise<boolean> {
    if (!this.isConnected()) {
      console.warn('Firebase not connected, skipping deleteChannel');
      return false;
    }
    
    try {
      await this.channelsRef.child(channelId).remove();
      return true;
    } catch (error) {
      console.error('Error deleting channel from Firebase:', error);
      return false;
    }
  }
  
  /**
   * Add a participant to a channel
   */
  async addParticipant(channelId: string, userId: string, userData: any): Promise<boolean> {
    if (!this.isConnected()) {
      console.warn('Firebase not connected, skipping addParticipant');
      return false;
    }
    
    try {
      await this.channelsRef.child(`${channelId}/participants/${userId}`).set({
        ...userData,
        joinedAt: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error adding participant to Firebase:', error);
      return false;
    }
  }
  
  /**
   * Remove a participant from a channel
   */
  async removeParticipant(channelId: string, userId: string): Promise<boolean> {
    if (!this.isConnected()) {
      console.warn('Firebase not connected, skipping removeParticipant');
      return false;
    }
    
    try {
      await this.channelsRef.child(`${channelId}/participants/${userId}`).remove();
      return true;
    } catch (error) {
      console.error('Error removing participant from Firebase:', error);
      return false;
    }
  }
  
  /**
   * Mark a message as read by a user
   */
  async markMessageAsRead(channelId: string, messageId: string, userId: string): Promise<boolean> {
    if (!this.isConnected()) {
      console.warn('Firebase not connected, skipping markMessageAsRead');
      return false;
    }
    
    try {
      await this.channelsRef.child(`${channelId}/messages/${messageId}/readBy/${userId}`).set(Date.now());
      return true;
    } catch (error) {
      console.error('Error marking message as read in Firebase:', error);
      return false;
    }
  }
}
