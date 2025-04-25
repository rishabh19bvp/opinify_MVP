import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Poll, CreatePollInput } from '../models/Poll';
import { User } from '../models/User';
import { DiscussionChannel } from '../models/DiscussionChannel';

/**
 * Create a new poll
 * @route POST /api/polls
 * @access Private
 */
export const createPoll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const pollData: CreatePollInput = req.body;
    
    // Convert location format from {latitude, longitude} to GeoJSON Point
    const poll = await Poll.create({
      title: pollData.title,
      description: pollData.description,
      location: {
        type: 'Point',
        coordinates: [pollData.location.longitude, pollData.location.latitude]
      },
      options: pollData.options.map(option => ({ text: option.text, count: 0 })),
      creator: new mongoose.Types.ObjectId(userId),
      expiresAt: pollData.expiresAt,
      category: pollData.category,
      tags: pollData.tags,
      status: 'active',
      totalVotes: 0
    });

    // auto-create discussion channel for the poll
    await DiscussionChannel.create({
      name: poll.title,
      description: poll.description || '',
      poll: poll._id,
      creator: poll.creator,
      participants: []
    });

    return res.status(201).json({
      success: true,
      data: poll
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    next(error);
  }
};

/**
 * Get all polls
 * @route GET /api/polls
 * @access Public
 */
import { authenticate } from '../middleware/auth';

export const getPolls = [authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    // Debug log: who is making the request
    console.log('[getPolls] userId:', userId);
    const polls = await Poll.find().sort({ createdAt: -1 }).populate('creator', 'username');
    const pollsWithVoteStatus = polls.map(poll => {
      const votesArr = poll.votes || [];
      // Debug log: show votes for each poll
      console.log(`[getPolls] pollId: ${poll._id}, votes:`, votesArr.map(v => v.userId && v.userId.toString()));
      const hasVoted = userId && votesArr.some(vote => vote.userId && vote.userId.toString() === userId);
      return {
        ...poll.toObject(),
        hasVoted,
      };
    });
    return res.status(200).json({
      success: true,
      count: polls.length,
      data: pollsWithVoteStatus
    });
  } catch (error) {
    next(error);
  }
}];

/**
 * Get a single poll by ID
 * @route GET /api/polls/:id
 * @access Public
 */
export const getPollById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poll = await Poll.findById(req.params.id).populate('creator', 'username');
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: poll
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nearby polls based on location
 * @route GET /api/polls/nearby
 * @access Public
 */
export const getNearbyPolls = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const rad = parseFloat(radius as string);
    
    if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates or radius'
      });
    }
    
    // Find polls within the specified radius
    const polls = await Poll.find();
    
    return res.status(200).json({
      success: true,
      count: polls.length,
      data: polls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vote on a poll
 * @route POST /api/polls/:id/vote
 * @access Private
 */
export const votePoll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { optionIndex } = req.body;
    const pollId = req.params.id;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    if (optionIndex === undefined || optionIndex === null) {
      return res.status(400).json({
        success: false,
        error: 'Option index is required'
      });
    }
    
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }
    
    // Check if poll is expired
    if (poll.isExpired()) {
      return res.status(400).json({
        success: false,
        error: 'Poll has expired'
      });
    }
    
    // Check if user has already voted
    const canVote = await poll.canVote(new mongoose.Types.ObjectId(userId));
    
    if (!canVote) {
      return res.status(400).json({
        success: false,
        error: 'You have already voted on this poll'
      });
    }
    
    // Check if option index is valid
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid option index'
      });
    }
    
    // Update poll with new vote
    poll.options[optionIndex].count += 1;
    poll.totalVotes += 1;
    
    // Initialize votes array if it doesn't exist
    if (!poll.votes) {
      poll.votes = [];
    }
    
    poll.votes.push({
      userId: new mongoose.Types.ObjectId(userId),
      optionIndex
    });
    
    await poll.save();
    // Increment the user's pollsVoted count
    await User.findByIdAndUpdate(userId, { $inc: { pollsVoted: 1 } });
    console.log(`[votePoll] Incremented pollsVoted for user ${userId}`);
    
    return res.status(200).json({
      success: true,
      data: poll
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get polls created by a specific user
 * @route GET /api/polls/user/:userId
 * @access Public
 */
export const getPollsByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    
    const polls = await Poll.find({ creator: userId }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: polls.length,
      data: polls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get polls by category
 * @route GET /api/polls/category/:category
 * @access Public
 */
export const getPollsByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = req.params.category;
    
    const polls = await Poll.find({ category }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: polls.length,
      data: polls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a poll
 * @route DELETE /api/polls/:id
 * @access Private
 */
export const deletePoll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pollId = req.params.id;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }
    
    // Check if user is the creator of the poll
    if (poll.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to delete this poll'
      });
    }
    
    await Poll.findByIdAndDelete(pollId);
    
    return res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
