import mongoose from 'mongoose';
import { Poll, CreatePollInput, IPollDocument } from '@/models/Poll';

/**
 * Service class for handling poll-related business logic
 */
export class PollService {
  /**
   * Create a new poll
   * @param pollData Poll creation data
   * @param userId ID of the user creating the poll
   * @returns Created poll document
   */
  static async createPoll(pollData: CreatePollInput, userId: string): Promise<IPollDocument> {
    try {
      const poll = await Poll.create({
        title: pollData.title,
        description: pollData.description,
        location: {
          type: 'Point',
          coordinates: [pollData.location.longitude, pollData.location.latitude]
        },
        options: pollData.options.map(option => ({ text: option.text, count: 0 })),
        creator: userId,
        expiresAt: pollData.expiresAt,
        category: pollData.category,
        tags: pollData.tags,
        status: 'active',
        totalVotes: 0
      });

      return poll;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all polls
   * @returns Array of poll documents
   */
  static async getAllPolls(): Promise<IPollDocument[]> {
    try {
      return await Poll.find().sort({ createdAt: -1 }).populate('creator', 'username');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a poll by ID
   * @param pollId ID of the poll to retrieve
   * @returns Poll document or null if not found
   */
  static async getPollById(pollId: string): Promise<IPollDocument | null> {
    try {
      return await Poll.findById(pollId).populate('creator', 'username');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get nearby polls based on location
   * @param latitude User's latitude
   * @param longitude User's longitude
   * @param radius Search radius in kilometers
   * @returns Array of nearby poll documents
   */
  static async getNearbyPolls(latitude: number, longitude: number, radius: number): Promise<IPollDocument[]> {
    try {
      const polls = await Poll.find();
      return polls;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vote on a poll
   * @param pollId ID of the poll to vote on
   * @param userId ID of the user voting
   * @param optionIndex Index of the option being voted for
   * @returns Updated poll document
   */
  static async votePoll(pollId: string, userId: string, optionIndex: number): Promise<IPollDocument> {
    try {
      const poll = await Poll.findById(pollId);
      
      if (!poll) {
        throw new Error('Poll not found');
      }
      
      // Check if poll is expired
      if (poll.isExpired()) {
        throw new Error('Poll has expired');
      }
      
      // Check if user has already voted
      const canVote = await poll.canVote(userId);
      
      if (!canVote) {
        throw new Error('You have already voted on this poll');
      }
      
      // Check if option index is valid
      if (optionIndex < 0 || optionIndex >= poll.options.length) {
        throw new Error('Invalid option index');
      }
      
      // Update poll with new vote
      poll.options[optionIndex].count += 1;
      poll.totalVotes += 1;
      
      // Initialize votes array if it doesn't exist
      if (!poll.votes) {
        poll.votes = [];
      }
      
      poll.votes.push({
        userId: userId,
        optionIndex: optionIndex
      });
      
      await poll.save();
      
      return poll;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get polls created by a specific user
   * @param userId ID of the user
   * @returns Array of poll documents
   */
  static async getPollsByUser(userId: string): Promise<IPollDocument[]> {
    try {
      return await Poll.find({ creator: userId }).sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get polls by category
   * @param category Poll category
   * @returns Array of poll documents
   */
  static async getPollsByCategory(category: string): Promise<IPollDocument[]> {
    try {
      return await Poll.find({ category }).sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a poll
   * @param pollId ID of the poll to delete
   * @param userId ID of the user attempting to delete
   * @returns Boolean indicating success
   */
  static async deletePoll(pollId: string, userId: string): Promise<boolean> {
    try {
      const poll = await Poll.findById(pollId);
      
      if (!poll) {
        throw new Error('Poll not found');
      }
      
      // Check if user is the creator of the poll
      if (poll.creator !== userId) {
        throw new Error('You are not authorized to delete this poll');
      }
      
      await Poll.findByIdAndDelete(pollId);
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update expired polls status
   * This can be run as a scheduled job
   * @returns Number of polls updated
   */
  static async updateExpiredPolls(): Promise<number> {
    try {
      const result = await Poll.updateMany(
        {
          expiresAt: { $lt: new Date() },
          status: 'active'
        },
        {
          $set: { status: 'expired' }
        }
      );
      
      return result.modifiedCount;
    } catch (error) {
      throw error;
    }
  }
}
