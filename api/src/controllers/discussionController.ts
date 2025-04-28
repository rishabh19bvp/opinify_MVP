import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { DiscussionChannel } from '../models/DiscussionChannel';
import { Poll } from '../models/Poll';
import { User } from '../models/User';
import { FirebaseService } from '../services/firebaseService';

// Initialize Firebase service
const firebaseService = new FirebaseService();

/**
 * Create a new discussion channel
 * @route POST /api/discussions
 * @access Private
 */
export const createChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, description, pollId, maxParticipants } = req.body;

    // Validate required fields
    if (!name || !pollId) {
      return res.status(400).json({
        success: false,
        error: 'Name and poll ID are required'
      });
    }

    // Check if poll exists
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }

    // Create channel in MongoDB
    const channel = await DiscussionChannel.create({
      name,
      description,
      poll: new mongoose.Types.ObjectId(pollId),
      creator: userId, // firebaseUid
      participants: [userId], // firebaseUid[]
      maxParticipants: maxParticipants || 50
    });

    // Create channel in Firebase if connected
    if (firebaseService.isConnected()) {
      // Get creator info
      const creator = await User.findOne({ firebaseUid: userId }).select('username');

      // Create in Firebase
      await firebaseService.createChannel(channel._id?.toString() || channel.id, {
        name,
        description,
        pollId,
        createdAt: new Date().toISOString(),
        creatorId: userId,
        creatorName: creator?.username || 'Unknown',
        participants: {
          [userId]: {
            joinedAt: new Date().toISOString(),
            username: creator?.username || 'Unknown'
          }
        }
      });
    }

    return res.status(201).json({
      success: true,
      data: channel
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
 * Get all discussion channels
 * @route GET /api/discussions
 * @access Public
 */
export const getChannels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pollId, active } = req.query;

    let query: any = {};

    // Filter by poll if provided
    if (pollId) {
      query.poll = new mongoose.Types.ObjectId(pollId as string);
    }

    // Filter by active status if provided
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    // Get channels
    const channels = await DiscussionChannel.find(query)
      .populate('creator', 'username')
      .populate('poll', 'title')
      .sort({ lastActivity: -1 });

    return res.status(200).json({
      success: true,
      count: channels.length,
      data: channels
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single discussion channel
 * @route GET /api/discussions/:id
 * @access Public
 */
export const getChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid channel ID'
      });
    }

    // Get channel with populated message senders for usernames
    const channel = await DiscussionChannel.findById(id)
      .populate({ path: 'messages.sender', select: 'username' })
      .populate('creator', 'username')
      .populate('poll', 'title')
      .populate('participants', 'username');

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: channel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join a discussion channel
 * @route POST /api/discussions/:id/join
 * @access Private
 */
export const joinChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid channel ID'
      });
    }

    // Get channel
    const channel = await DiscussionChannel.findById(id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    // Check if channel is active
    if (!channel.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Channel is not active'
      });
    }

    try {
      // Add user to participants
      const added = await channel.addParticipant(userId);
      
      if (!added) {
        return res.status(400).json({
          success: false,
          error: 'User is already a participant'
        });
      }

      // Add to Firebase if connected
      if (firebaseService.isConnected()) {
        // Get user info
        const user = await User.findOne({ firebaseUid: userId }).select('username');

        // Add to Firebase
        await firebaseService.addParticipant(id, userId, {
          joinedAt: new Date().toISOString(),
          username: user?.username || 'Unknown'
        });
      }

      // Increment user's groupsCount
      await User.findOneAndUpdate({ firebaseUid: userId }, { $inc: { groupsCount: 1 } });
      console.log(`[joinChannel] Incremented groupsCount for user ${userId}`);

      return res.status(200).json({
        success: true,
        data: channel
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Leave a discussion channel
 * @route POST /api/discussions/:id/leave
 * @access Private
 */
export const leaveChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid channel ID'
      });
    }

    // Get channel
    const channel = await DiscussionChannel.findById(id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    // Remove user from participants
    const removed = await channel.removeParticipant(userId);
    
    if (!removed) {
      return res.status(400).json({
        success: false,
        error: 'User is not a participant'
      });
    }

    // Remove from Firebase if connected
    if (firebaseService.isConnected()) {
      await firebaseService.removeParticipant(id, userId);
    }

    // Decrement user's groupsCount
    await User.findOneAndUpdate({ firebaseUid: userId }, { $inc: { groupsCount: -1 } });
    console.log(`[leaveChannel] Decremented groupsCount for user ${userId}`);

    return res.status(200).json({
      success: true,
      data: channel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message to a discussion channel
 * @route POST /api/discussions/:id/messages
 * @access Private
 */
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { content } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid channel ID'
      });
    }

    // Get channel
    const channel = await DiscussionChannel.findById(id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    try {
      // Add message to channel
      const message = await channel.addMessage(
        userId,
        content
      );

      // Add to Firebase if connected
      let firebaseMessageId = null;
      if (firebaseService.isConnected()) {
        // Get user info
        const user = await User.findOne({ firebaseUid: userId }).select('username');

        // Add to Firebase
        firebaseMessageId = await firebaseService.addMessage(id, {
          content,
          senderId: userId,
          senderName: user?.username || 'Unknown',
          readBy: {
            [userId]: new Date().toISOString()
          }
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          ...message.toObject(),
          firebaseId: firebaseMessageId
        }
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages from a discussion channel
 * @route GET /api/discussions/:id/messages
 * @access Private
 */
export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { limit = '50', startAt } = req.query;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid channel ID'
      });
    }

    // Get channel
    // Populate message senders so each message has a sender.username
    const channel = await DiscussionChannel.findById(id)
      .populate({ path: 'messages.sender', select: 'username' });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    // Check if user is a participant
    const isParticipant = channel.participants.some((p: string) => p === userId);
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'User is not a participant in this channel'
      });
    }

    // Get messages from Firebase if connected (for real-time data)
    if (firebaseService.isConnected()) {
      const messages = await firebaseService.getMessages(
        id,
        parseInt(limit as string),
        startAt as string
      );

      return res.status(200).json({
        success: true,
        count: messages.length,
        data: messages
      });
    }

    // Otherwise, get messages from MongoDB
    // Sort messages by timestamp (newest first) and apply limit
    const messages = channel.messages
      .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, parseInt(limit as string));

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a message as read
 * @route POST /api/discussions/:id/messages/:messageId/read
 * @access Private
 */
export const markMessageAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id, messageId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid channel or message ID'
      });
    }

    // Get channel
    const channel = await DiscussionChannel.findById(id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    // Mark message as read
    const marked = await channel.markMessageAsRead(
      userId,
      new mongoose.Types.ObjectId(messageId)
    );
    
    if (!marked) {
      return res.status(400).json({
        success: false,
        error: 'Failed to mark message as read'
      });
    }

    // Mark in Firebase if connected
    if (firebaseService.isConnected()) {
      await firebaseService.markMessageAsRead(id, messageId, userId);
    }

    return res.status(200).json({
      success: true,
      data: { read: true }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Close a discussion channel (deactivate)
 * @route PUT /api/discussions/:id/close
 * @access Private
 */
export const closeChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid channel ID'
      });
    }

    // Get channel
    const channel = await DiscussionChannel.findById(id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    // Check if user is the creator
    if (channel.creator !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the channel creator can close the channel'
      });
    }

    // Deactivate channel
    channel.isActive = false;
    await channel.save();

    // Update in Firebase if connected
    if (firebaseService.isConnected()) {
      await firebaseService.updateChannel(id, {
        isActive: false,
        closedAt: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      data: channel
    });
  } catch (error) {
    next(error);
  }
};
