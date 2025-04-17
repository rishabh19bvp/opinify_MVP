import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Poll } from '@/models/Poll';
import { User } from '@/models/User';
import pollRoutes from '@/routes/pollRoutes';
import * as authMiddleware from '@/middleware/auth';
import { cleanupDatabase } from '@/__tests__/setup/jest.setup';

// Mock the authenticate middleware
jest.mock('@/middleware/auth', () => {
  return {
    authenticate: jest.fn((req, res, next) => {
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as { id: string };
          req.user = { id: decoded.id };
          next();
        } catch (error) {
          res.status(401).json({ success: false, error: 'Invalid token' });
        }
      } else {
        res.status(401).json({ success: false, error: 'No token provided' });
      }
    })
  };
});

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/polls', pollRoutes);

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';

describe('Poll Controller', () => {
  let testUser: any;
  let testToken: string;

  beforeAll(async () => {
    await cleanupDatabase();
    
    // Create a test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!',
      location: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    });

    // Generate JWT token for testing
    testToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }, 30000);

  beforeEach(async () => {
    // Clear polls collection before each test
    await Poll.deleteMany({});
  });

  describe('POST /api/polls', () => {
    it('should create a new poll', async () => {
      const pollData = {
        title: 'Test Poll',
        description: 'This is a test poll',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        },
        options: [
          { text: 'Option 1' },
          { text: 'Option 2' }
        ],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        category: 'Test',
        tags: ['test', 'example']
      };

      const response = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${testToken}`)
        .send(pollData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.title).toBe(pollData.title);
      expect(response.body.data.description).toBe(pollData.description);
      expect(response.body.data.options.length).toBe(pollData.options.length);
      expect(response.body.data.category).toBe(pollData.category);
      expect(response.body.data.tags).toEqual(pollData.tags);
    });

    it('should return 401 if not authenticated', async () => {
      const pollData = {
        title: 'Test Poll',
        description: 'This is a test poll',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        },
        options: [
          { text: 'Option 1' },
          { text: 'Option 2' }
        ],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/polls')
        .send(pollData);

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid poll data', async () => {
      const invalidPollData = {
        // Missing required fields
        title: '',
        description: 'This is a test poll',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        },
        options: [],
        expiresAt: new Date(Date.now() - 1000) // Past date
      };

      const response = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidPollData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/polls/nearby', () => {
    beforeEach(async () => {
      // Create test polls with different locations
      await Poll.create({
        title: 'Test Poll 1',
        description: 'This is test poll 1',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716] // Bangalore
        },
        options: [
          { text: 'Option 1', count: 0 },
          { text: 'Option 2', count: 0 }
        ],
        creator: testUser._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active'
      });

      await Poll.create({
        title: 'Test Poll 2',
        description: 'This is test poll 2',
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760] // Mumbai (far from Bangalore)
        },
        options: [
          { text: 'Option 1', count: 0 },
          { text: 'Option 2', count: 0 }
        ],
        creator: testUser._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active'
      });
    });

    it('should return nearby polls within radius', async () => {
      // Ensure the index exists
      try {
        await Poll.collection.createIndex({ location: '2dsphere' });
      } catch (error) {
        console.log('Index creation error:', error);
      }
      
      // Wait to ensure index is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await request(app)
        .get('/api/polls/nearby')
        .query({
          latitude: 12.9716,
          longitude: 77.5946,
          radius: 10 // 10km radius
        });

      if (response.status !== 200) {
        console.log('Error response:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].title).toBe('Test Poll 1');
    });

    it('should return 400 for missing coordinates', async () => {
      const response = await request(app)
        .get('/api/polls/nearby')
        .query({
          radius: 10
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/polls/:id/vote', () => {
    let testPoll: any;

    beforeEach(async () => {
      // Create a test poll
      testPoll = await Poll.create({
        title: 'Voting Test Poll',
        description: 'This is a test poll for voting',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716]
        },
        options: [
          { text: 'Option 1', count: 0 },
          { text: 'Option 2', count: 0 }
        ],
        creator: testUser._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active',
        votes: []
      });
    });

    it('should allow a user to vote on a poll', async () => {
      const response = await request(app)
        .post(`/api/polls/${testPoll._id}/vote`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ optionIndex: 0 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.options[0].count).toBe(1);
      expect(response.body.data.totalVotes).toBe(1);
    });

    it('should prevent duplicate votes', async () => {
      // First vote
      await request(app)
        .post(`/api/polls/${testPoll._id}/vote`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ optionIndex: 0 });

      // Try to vote again
      const response = await request(app)
        .post(`/api/polls/${testPoll._id}/vote`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ optionIndex: 1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('You have already voted on this poll');
    });

    it('should return 400 for invalid option index', async () => {
      const response = await request(app)
        .post(`/api/polls/${testPoll._id}/vote`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ optionIndex: 5 }); // Invalid index

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post(`/api/polls/${testPoll._id}/vote`)
        .send({ optionIndex: 0 });

      expect(response.status).toBe(401);
    });
  });
});
