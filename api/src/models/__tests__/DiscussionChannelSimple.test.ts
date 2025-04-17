import mongoose from 'mongoose';
import { DiscussionChannel } from '../DiscussionChannel';
import * as dbHandler from '../../__tests__/setup/mongo-memory-server';

beforeAll(async () => {
  await dbHandler.connect();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

describe('DiscussionChannel Model Basic Tests', () => {
  it('should create a new discussion channel successfully', async () => {
    // Create test user ID
    const userId = new mongoose.Types.ObjectId();
    
    // Create test poll ID
    const pollId = new mongoose.Types.ObjectId();
    
    // Create test channel
    const channel = await DiscussionChannel.create({
      name: 'Test Channel',
      description: 'Test channel description',
      poll: pollId,
      creator: userId,
      participants: [userId],
      maxParticipants: 50
    });
    
    expect(channel).toBeTruthy();
    expect(channel.name).toBe('Test Channel');
    expect(channel.description).toBe('Test channel description');
    expect(channel.poll.toString()).toBe(pollId.toString());
    expect(channel.creator.toString()).toBe(userId.toString());
    expect(channel.participants.length).toBe(1);
    expect(channel.participants[0].toString()).toBe(userId.toString());
    expect(channel.isActive).toBe(true);
    expect(channel.maxParticipants).toBe(50);
  });

  it('should require a name', async () => {
    const userId = new mongoose.Types.ObjectId();
    const pollId = new mongoose.Types.ObjectId();
    
    try {
      await DiscussionChannel.create({
        poll: pollId,
        creator: userId,
        participants: [userId]
      });
      fail('Should have thrown a validation error');
    } catch (error: any) {
      expect(error.name).toBe('ValidationError');
      expect(error.errors.name).toBeDefined();
    }
  });
});
