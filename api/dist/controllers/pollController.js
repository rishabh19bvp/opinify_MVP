"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePoll = exports.getPollsByCategory = exports.getPollsByUser = exports.votePoll = exports.getNearbyPolls = exports.getPollById = exports.getPolls = exports.createPoll = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Poll_1 = require("../models/Poll");
/**
 * Create a new poll
 * @route POST /api/polls
 * @access Private
 */
const createPoll = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const pollData = req.body;
        // Convert location format from {latitude, longitude} to GeoJSON Point
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
        return res.status(201).json({
            success: true,
            data: poll
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({
                success: false,
                error: messages
            });
        }
        next(error);
    }
};
exports.createPoll = createPoll;
/**
 * Get all polls
 * @route GET /api/polls
 * @access Public
 */
const getPolls = async (req, res, next) => {
    try {
        const polls = await Poll_1.Poll.find().sort({ createdAt: -1 }).populate('creator', 'username');
        return res.status(200).json({
            success: true,
            count: polls.length,
            data: polls
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPolls = getPolls;
/**
 * Get a single poll by ID
 * @route GET /api/polls/:id
 * @access Public
 */
const getPollById = async (req, res, next) => {
    try {
        const poll = await Poll_1.Poll.findById(req.params.id).populate('creator', 'username');
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
    }
    catch (error) {
        next(error);
    }
};
exports.getPollById = getPollById;
/**
 * Get nearby polls based on location
 * @route GET /api/polls/nearby
 * @access Public
 */
const getNearbyPolls = async (req, res, next) => {
    try {
        const { latitude, longitude, radius = 10 } = req.query;
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const rad = parseFloat(radius);
        if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid coordinates or radius'
            });
        }
        // Find polls within the specified radius
        const polls = await Poll_1.Poll.find();
        return res.status(200).json({
            success: true,
            count: polls.length,
            data: polls
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNearbyPolls = getNearbyPolls;
/**
 * Vote on a poll
 * @route POST /api/polls/:id/vote
 * @access Private
 */
const votePoll = async (req, res, next) => {
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
        const poll = await Poll_1.Poll.findById(pollId);
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
        const canVote = await poll.canVote(new mongoose_1.default.Types.ObjectId(userId));
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
            userId: new mongoose_1.default.Types.ObjectId(userId),
            optionIndex
        });
        await poll.save();
        return res.status(200).json({
            success: true,
            data: poll
        });
    }
    catch (error) {
        next(error);
    }
};
exports.votePoll = votePoll;
/**
 * Get polls created by a specific user
 * @route GET /api/polls/user/:userId
 * @access Public
 */
const getPollsByUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const polls = await Poll_1.Poll.find({ creator: userId }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: polls.length,
            data: polls
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPollsByUser = getPollsByUser;
/**
 * Get polls by category
 * @route GET /api/polls/category/:category
 * @access Public
 */
const getPollsByCategory = async (req, res, next) => {
    try {
        const category = req.params.category;
        const polls = await Poll_1.Poll.find({ category }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: polls.length,
            data: polls
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPollsByCategory = getPollsByCategory;
/**
 * Delete a poll
 * @route DELETE /api/polls/:id
 * @access Private
 */
const deletePoll = async (req, res, next) => {
    try {
        const pollId = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        const poll = await Poll_1.Poll.findById(pollId);
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
        await Poll_1.Poll.findByIdAndDelete(pollId);
        return res.status(200).json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deletePoll = deletePoll;
