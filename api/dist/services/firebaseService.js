"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = exports.initializeFirebase = void 0;
const app_1 = require("firebase-admin/app");
const database_1 = require("firebase-admin/database");
const config_1 = require("../config");
const fs_1 = __importDefault(require("fs"));
// Initialize Firebase Admin SDK
let firebaseApp;
let firebaseDb;
/**
 * Initialize Firebase connection
 */
const initializeFirebase = () => {
    try {
        // Check if already initialized
        if (firebaseApp) {
            return firebaseDb;
        }
        // Get service account path from config
        const serviceAccountPath = config_1.config.firebase.serviceAccountPath;
        // Check if service account file exists
        if (!serviceAccountPath || !fs_1.default.existsSync(serviceAccountPath)) {
            console.warn('Firebase service account file not found, using demo mode');
            return null;
        }
        // Load service account
        const serviceAccount = JSON.parse(fs_1.default.readFileSync(serviceAccountPath, 'utf8'));
        // Initialize app
        firebaseApp = (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(serviceAccount),
            databaseURL: config_1.config.firebase.databaseURL
        });
        // Get database reference
        firebaseDb = (0, database_1.getDatabase)(firebaseApp);
        console.log('Firebase Realtime Database initialized');
        return firebaseDb;
    }
    catch (error) {
        console.error('Error initializing Firebase:', error);
        return null;
    }
};
exports.initializeFirebase = initializeFirebase;
/**
 * Firebase Realtime Database Service
 */
class FirebaseService {
    constructor() {
        // Initialize Firebase if not already done
        this.db = (0, exports.initializeFirebase)();
        if (this.db) {
            this.channelsRef = this.db.ref('channels');
        }
    }
    /**
     * Check if Firebase is connected
     */
    isConnected() {
        return !!this.db;
    }
    /**
     * Create a new channel in Firebase
     */
    async createChannel(channelId, channelData) {
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
        }
        catch (error) {
            console.error('Error creating channel in Firebase:', error);
            return false;
        }
    }
    /**
     * Add a message to a channel
     */
    async addMessage(channelId, message) {
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
        }
        catch (error) {
            console.error('Error adding message to Firebase:', error);
            return null;
        }
    }
    /**
     * Get messages from a channel with pagination
     */
    async getMessages(channelId, limit = 50, startAt) {
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
            const messages = [];
            snapshot.forEach((childSnapshot) => {
                messages.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            return messages.reverse();
        }
        catch (error) {
            console.error('Error getting messages from Firebase:', error);
            return [];
        }
    }
    /**
     * Update channel metadata
     */
    async updateChannel(channelId, data) {
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
        }
        catch (error) {
            console.error('Error updating channel in Firebase:', error);
            return false;
        }
    }
    /**
     * Delete a channel
     */
    async deleteChannel(channelId) {
        if (!this.isConnected()) {
            console.warn('Firebase not connected, skipping deleteChannel');
            return false;
        }
        try {
            await this.channelsRef.child(channelId).remove();
            return true;
        }
        catch (error) {
            console.error('Error deleting channel from Firebase:', error);
            return false;
        }
    }
    /**
     * Add a participant to a channel
     */
    async addParticipant(channelId, userId, userData) {
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
        }
        catch (error) {
            console.error('Error adding participant to Firebase:', error);
            return false;
        }
    }
    /**
     * Remove a participant from a channel
     */
    async removeParticipant(channelId, userId) {
        if (!this.isConnected()) {
            console.warn('Firebase not connected, skipping removeParticipant');
            return false;
        }
        try {
            await this.channelsRef.child(`${channelId}/participants/${userId}`).remove();
            return true;
        }
        catch (error) {
            console.error('Error removing participant from Firebase:', error);
            return false;
        }
    }
    /**
     * Mark a message as read by a user
     */
    async markMessageAsRead(channelId, messageId, userId) {
        if (!this.isConnected()) {
            console.warn('Firebase not connected, skipping markMessageAsRead');
            return false;
        }
        try {
            await this.channelsRef.child(`${channelId}/messages/${messageId}/readBy/${userId}`).set(Date.now());
            return true;
        }
        catch (error) {
            console.error('Error marking message as read in Firebase:', error);
            return false;
        }
    }
}
exports.FirebaseService = FirebaseService;
