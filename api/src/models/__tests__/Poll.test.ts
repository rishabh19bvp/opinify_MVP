import mongoose from 'mongoose';
import { cleanupDatabase } from '@/__tests__/setup/jest.setup';
import { Poll, IPollDocument } from '@/models/Poll';
import { User } from '@/models/User';

describe('Poll Model', () => {
  let testUser: mongoose.Types.ObjectId;
  const testPollData = {
    title: 'Test Poll',
    description: 'This is a test poll',
    options: [
      { text: 'Option 1', count: 0 },
      { text: 'Option 2', count: 0 }
    ],
    expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
    status: 'active',
    category: 'general'
  };

  beforeEach(async () => {
    await cleanupDatabase();
    const user = await User.create({
      username: `testuser-${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'Test123!'
    });
    testUser = user._id as mongoose.Types.ObjectId;
  });

  afterEach(async () => {
    await Poll.deleteMany({});
  });

  describe('Creation', () => {
    it('should create a valid poll', async () => {
      const poll = await Poll.create({
        ...testPollData,
        creator: testUser
      });

      expect(poll.title).toBe(testPollData.title);
      expect(poll.description).toBe(testPollData.description);
      expect(poll.options.length).toBe(testPollData.options.length);
      expect(poll.options[0].text).toBe(testPollData.options[0].text);
      expect(poll.options[0].count).toBe(testPollData.options[0].count);
    });

    it('should throw error for invalid title', async () => {
      const invalidPoll = { ...testPollData, title: '' };
      await expect(Poll.create({
        ...invalidPoll,
        creator: testUser
      })).rejects.toThrow('Title is required');
    });

    it('should allow empty options array', async () => {
      const invalidPoll = { ...testPollData, options: [] };
      const result = await Poll.create({
        ...invalidPoll,
        creator: testUser
      });
      expect(result.options.length).toBe(0);
    });

    it('should throw error for too many options', async () => {
      const invalidPoll = { ...testPollData, options: Array(11).fill({ text: 'Option', count: 0 }) };
      await expect(Poll.create({
        ...invalidPoll,
        creator: testUser
      })).rejects.toThrow('Options array must have at most 10 elements');
    });

    it('should throw error for invalid option format', async () => {
      const invalidPoll = { ...testPollData, options: [{ text: '', count: 0 }] };
      await expect(Poll.create({
        ...invalidPoll,
        creator: testUser
      })).rejects.toThrow('Option text is required');
    });

    it('should throw error for options with negative count', async () => {
      const invalidPoll = { ...testPollData, options: [{ text: 'Option 1', count: -1 }] };
      await expect(Poll.create({
        ...invalidPoll,
        creator: testUser
      })).rejects.toThrow('Option count must be a non-negative integer');
    });

    it('should throw error for invalid expiresAt', async () => {
      const invalidPoll = { ...testPollData, expiresAt: new Date('invalid') };
      await expect(Poll.create({
        ...invalidPoll,
        creator: testUser
      })).rejects.toThrow('ExpiresAt must be a valid date');
    });

    it('should throw error for invalid status', async () => {
      const invalidPoll = { ...testPollData, status: 'invalid' as any };
      await expect(Poll.create({
        ...invalidPoll,
        creator: testUser
      })).rejects.toThrow('Invalid status');
    });

    it('should throw error for invalid category', async () => {
      const invalidPoll = { ...testPollData, category: 'invalid' };
      await expect(Poll.create({
        ...invalidPoll,
        creator: testUser
      })).rejects.toThrow('Category is required');
    });

    it('should create poll with default values', async () => {
      const poll = await Poll.create({
        title: 'Test Poll',
        description: 'Test Description',
        options: [{ text: 'Option 1', count: 0 }],
        creator: testUser
      });

      expect(poll.status).toBe('active');
      expect(poll.category).toBe('general');
      expect(poll.totalVotes).toBe(0);
      expect(poll.votes).toEqual([]);
    });
  });

  describe('Poll Methods', () => {
    let testPoll: IPollDocument;

    beforeEach(async () => {
      testPoll = await Poll.create({
        ...testPollData,
        creator: testUser
      });
    });

    it('should check if poll is expired', async () => {
      const now = new Date();
      const expiredPoll = await Poll.create({
        ...testPollData,
        creator: testUser,
        expiresAt: new Date(now.getTime() - 1000)
      });

      expect(expiredPoll.isExpired()).toBe(true);
      expect(testPoll.isExpired()).toBe(false);
    });

    it('should check if user can vote', async () => {
      const userId = new mongoose.Types.ObjectId();
      const poll = await Poll.create({
        ...testPollData,
        creator: testUser
      });

      // User hasn't voted yet
      expect(await poll.canVote(userId)).toBe(true);

      // Add a vote from the user
      if (!poll.votes) poll.votes = [];
      poll.votes.push({ userId, optionIndex: 0 });
      await poll.save();

      // User has already voted
      expect(await poll.canVote(userId)).toBe(false);
    });

    it('should calculate total votes', async () => {
      const poll = await Poll.create({
        ...testPollData,
        creator: testUser,
        votes: [
          { userId: testUser, optionIndex: 0 },
          { userId: testUser, optionIndex: 1 }
        ]
      });

      expect(poll.totalVotes).toBe(2);
    });

    it('should update option counts', async () => {
      const poll = await Poll.create({
        ...testPollData,
        creator: testUser,
        votes: [
          { userId: testUser, optionIndex: 0 },
          { userId: testUser, optionIndex: 0 },
          { userId: testUser, optionIndex: 1 }
        ]
      });

      expect(poll.options[0].count).toBe(2);
      expect(poll.options[1].count).toBe(1);
    });

    it('should update status automatically', async () => {
      const poll = await Poll.create({
        ...testPollData,
        creator: testUser,
        expiresAt: new Date(Date.now() - 86400000) // Expired 24 hours ago
      });

      expect(poll.status).toBe('expired');
    });

    it('should update status when saved', async () => {
      const poll = await Poll.create({
        ...testPollData,
        creator: testUser,
        status: 'active',
        expiresAt: new Date(Date.now() - 86400000) // Expired 24 hours ago
      });

      await poll.save();
      expect(poll.status).toBe('expired');
    });
  });

  describe('Poll Queries', () => {
    it('should find polls by creator', async () => {
      const poll = await Poll.create({
        ...testPollData,
        creator: testUser
      });

      const foundPolls = await Poll.findByCreator(testUser);
      expect(foundPolls.length).toBe(1);
      expect(foundPolls[0].id).toBe(poll.id);
    });

    it('should find polls by category', async () => {
      const poll = await Poll.create({
        ...testPollData,
        creator: testUser
      });

      const foundPolls = await Poll.findByCategory(testPollData.category);
      expect(foundPolls.length).toBe(1);
      expect(foundPolls[0].id).toBe(poll.id);
    });
  });
});
