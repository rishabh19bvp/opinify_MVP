"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Poll_1 = require("@/models/Poll");
/**
 * Service class for handling poll-related business logic
 */
class PollService {
    /**
     * Create a new poll
     * @param pollData Poll creation data
     * @param userId ID of the user creating the poll
     * @returns Created poll document
     */
    static async createPoll(pollData, userId) {
        try {
            const poll = await Poll_1.Poll.create({
                title: pollData.title,
                description: pollData.description,
                location: {
                    type: 'Point',
                    coordinates: [pollData.location.longitude, pollData.location.latitude]
                },
                options: pollData.options.map(option => ({ text: option.text, count: 0 })),
                creator: new mongoose_1.default.Types.ObjectId(userId),
                expiresAt: pollData.expiresAt,
                category: pollData.category,
                tags: pollData.tags,
                status: 'active',
                totalVotes: 0
            });
            return poll;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get all polls
     * @returns Array of poll documents
     */
    static async getAllPolls() {
        try {
            return await Poll_1.Poll.find().sort({ createdAt: -1 }).populate('creator', 'username');
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get a poll by ID
     * @param pollId ID of the poll to retrieve
     * @returns Poll document or null if not found
     */
    static async getPollById(pollId) {
        try {
            return await Poll_1.Poll.findById(pollId).populate('creator', 'username');
        }
        catch (error) {
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
    static async getNearbyPolls(latitude, longitude, radius) {
        try {
            const polls = await Poll_1.Poll.find();
            return polls;
        }
        catch (error) {
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
    static async votePoll(pollId, userId, optionIndex) {
        try {
            const poll = await Poll_1.Poll.findById(pollId);
            if (!poll) {
                throw new Error('Poll not found');
            }
            // Check if poll is expired
            if (poll.isExpired()) {
                throw new Error('Poll has expired');
            }
            // Check if user has already voted
            const canVote = await poll.canVote(new mongoose_1.default.Types.ObjectId(userId));
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
                userId: new mongoose_1.default.Types.ObjectId(userId),
                optionIndex
            });
            await poll.save();
            return poll;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get polls created by a specific user
     * @param userId ID of the user
     * @returns Array of poll documents
     */
    static async getPollsByUser(userId) {
        try {
            return await Poll_1.Poll.find({ creator: userId }).sort({ createdAt: -1 });
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get polls by category
     * @param category Poll category
     * @returns Array of poll documents
     */
    static async getPollsByCategory(category) {
        try {
            return await Poll_1.Poll.find({ category }).sort({ createdAt: -1 });
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Delete a poll
     * @param pollId ID of the poll to delete
     * @param userId ID of the user attempting to delete
     * @returns Boolean indicating success
     */
    static async deletePoll(pollId, userId) {
        try {
            const poll = await Poll_1.Poll.findById(pollId);
            if (!poll) {
                throw new Error('Poll not found');
            }
            // Check if user is the creator of the poll
            if (poll.creator.toString() !== userId) {
                throw new Error('You are not authorized to delete this poll');
            }
            await Poll_1.Poll.findByIdAndDelete(pollId);
            return true;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Update expired polls status
     * This can be run as a scheduled job
     * @returns Number of polls updated
     */
    static async updateExpiredPolls() {
        try {
            const result = await Poll_1.Poll.updateMany({
                expiresAt: { $lt: new Date() },
                status: 'active'
            }, {
                $set: { status: 'expired' }
            });
            return result.modifiedCount;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.PollService = PollService;
