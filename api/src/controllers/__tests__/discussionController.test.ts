import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import { DiscussionChannel } from '../../models/DiscussionChannel';
import discussionRoutes from '../../routes/discussionRoutes';
import { FirebaseService } from '../../services/firebaseService';
import * as dbHandler from '../../__tests__/setup/mongo-memory-server';

// Mock Firebase service
jest.mock('../../services/firebaseService');

// Add type definitions for request.user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

let app: express.Application;
let testUserId: mongoose.Types.ObjectId;
let testPollId: mongoose.Types.ObjectId;
let testChannelId: mongoose.Types.ObjectId;
let authToken: string;

beforeAll(async () => {
  await dbHandler.connect();

  // Setup Express app
  app = express();
  app.use(express.json());
  app.use('/api/discussions', discussionRoutes);

  // Mock middleware for tests to handle authentication
  app.use((req, res, next) => {
    if (req.headers.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      if (token === 'test-token') {
        req.user = { id: testUserId.toString() };
      }
    }
    next();
  });

  // Mock Firebase service methods
  const mockFirebaseService = FirebaseService as jest.MockedClass<typeof FirebaseService>;
  mockFirebaseService.prototype.isConnected.mockReturnValue(false);
  mockFirebaseService.prototype.createChannel.mockResolvedValue(true);
  mockFirebaseService.prototype.addMessage.mockResolvedValue('mock-message-id');
  mockFirebaseService.prototype.addParticipant.mockResolvedValue(true);
  mockFirebaseService.prototype.removeParticipant.mockResolvedValue(true);
  mockFirebaseService.prototype.markMessageAsRead.mockResolvedValue(true);
  mockFirebaseService.prototype.updateChannel.mockResolvedValue(true);
});

beforeEach(async () => {
  // Clear collections
  await dbHandler.clearDatabase();

  // Create test IDs
  testUserId = new mongoose.Types.ObjectId();
  testPollId = new mongoose.Types.ObjectId();

  // Create test channel
  const channel = await DiscussionChannel.create({
    name: 'Test Channel',
    description: 'Test channel description',
    poll: testPollId,
    creator: testUserId,
    participants: [testUserId],
    maxParticipants: 50
  });
  
  testChannelId = channel._id as mongoose.Types.ObjectId;

  // Generate auth token
  authToken = 'test-token';
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe('Discussion Controller Basic Tests', () => {
  // Test getting all channels
  describe('GET /api/discussions', () => {
    it('should get all discussion channels', async () => {
      const res = await request(app).get('/api/discussions');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // Test getting a specific channel
  describe('GET /api/discussions/:id', () => {
    it('should get a single discussion channel', async () => {
      const res = await request(app)
        .get(`/api/discussions/${testChannelId}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Channel');
    });

    it('should return 404 for non-existent channel', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/discussions/${nonExistentId}`);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});

