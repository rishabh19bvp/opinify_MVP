import mongoose, { Document, Schema } from 'mongoose';
import { IPollDocument } from './Poll';

// Message interface
export interface IMessage {
  sender: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  readBy: mongoose.Types.ObjectId[];
}

// Message as a document
export interface IMessageDocument extends IMessage, Document {}

// Message schema
const messageSchema = new Schema<IMessageDocument, mongoose.Model<IMessageDocument>>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Discussion channel interface
export interface IDiscussionChannel {
  name: string;
  description?: string;
  poll: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  messages: IMessage[];
  isActive: boolean;
  lastActivity: Date;
  maxParticipants: number;
}

// Discussion channel as a document
export interface IDiscussionChannelDocument extends IDiscussionChannel, Document {
  addMessage(senderId: mongoose.Types.ObjectId, content: string): Promise<IMessageDocument>;
  addParticipant(userId: mongoose.Types.ObjectId): Promise<boolean>;
  removeParticipant(userId: mongoose.Types.ObjectId): Promise<boolean>;
  markMessageAsRead(userId: mongoose.Types.ObjectId, messageId: mongoose.Types.ObjectId): Promise<boolean>;
  getUnreadCount(userId: mongoose.Types.ObjectId): Promise<number>;
}

// Discussion channel schema
const discussionChannelSchema = new Schema<IDiscussionChannelDocument, mongoose.Model<IDiscussionChannelDocument>>({
  name: {
    type: String,
    required: [true, 'Channel name is required'],
    trim: true,
    maxlength: [100, 'Channel name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  poll: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: [true, 'Associated poll is required']
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  maxParticipants: {
    type: Number,
    default: 50,
    max: [100, 'Free tier limited to 100 participants per channel']
  }
}, {
  timestamps: true
});

// Create indexes
discussionChannelSchema.index({ poll: 1 });
discussionChannelSchema.index({ participants: 1 });
discussionChannelSchema.index({ lastActivity: -1 });

// Add a message to the channel
discussionChannelSchema.methods.addMessage = async function(
  senderId: mongoose.Types.ObjectId,
  content: string
): Promise<IMessageDocument> {
  // Check if user is a participant
  if (!this.participants.some((p: mongoose.Types.ObjectId) => p.equals(senderId))) {
    throw new Error('User is not a participant in this channel');
  }
  
  // Create new message
  const message = {
    sender: senderId,
    content,
    timestamp: new Date(),
    readBy: [senderId] // Sender has read their own message
  };
  
  // Add to messages array
  this.messages.push(message);
  
  // Update last activity
  this.lastActivity = new Date();
  
  // Save the channel
  await this.save();
  
  // Return the new message
  return this.messages[this.messages.length - 1];
};

// Add a participant to the channel
discussionChannelSchema.methods.addParticipant = async function(
  userId: mongoose.Types.ObjectId
): Promise<boolean> {
  // Check if user is already a participant
  if (this.participants.some((p: mongoose.Types.ObjectId) => p.equals(userId))) {
    return false;
  }
  
  // Check if channel is at capacity
  if (this.participants.length >= this.maxParticipants) {
    throw new Error('Channel has reached maximum participant limit');
  }
  
  // Add user to participants
  this.participants.push(userId);
  
  // Save the channel
  await this.save();
  
  return true;
};

// Remove a participant from the channel
discussionChannelSchema.methods.removeParticipant = async function(
  userId: mongoose.Types.ObjectId
): Promise<boolean> {
  // Check if user is a participant
  if (!this.participants.some((p: mongoose.Types.ObjectId) => p.equals(userId))) {
    return false;
  }
  
  // Remove user from participants
  this.participants = this.participants.filter((p: mongoose.Types.ObjectId) => !p.equals(userId));
  
  // Save the channel
  await this.save();
  
  return true;
};

// Mark a message as read by a user
discussionChannelSchema.methods.markMessageAsRead = async function(
  userId: mongoose.Types.ObjectId,
  messageId: mongoose.Types.ObjectId
): Promise<boolean> {
  // Check if user is a participant
  if (!this.participants.some((p: mongoose.Types.ObjectId) => p.equals(userId))) {
    return false;
  }
  
  // Find the message
  const message = this.messages.id(messageId);
  if (!message) {
    return false;
  }
  
  // Check if user has already read the message
  if (message.readBy.some((id: mongoose.Types.ObjectId) => id.equals(userId))) {
    return true;
  }
  
  // Mark as read
  message.readBy.push(userId);
  
  // Save the channel
  await this.save();
  
  return true;
};

// Get count of unread messages for a user
discussionChannelSchema.methods.getUnreadCount = async function(
  userId: mongoose.Types.ObjectId
): Promise<number> {
  // Check if user is a participant
  if (!this.participants.some((p: mongoose.Types.ObjectId) => p.equals(userId))) {
    return 0;
  }
  
  // Count messages not read by the user
  return this.messages.filter((m: IMessage) => !m.readBy.some((id: mongoose.Types.ObjectId) => id.equals(userId))).length;
};

// Static method to find channels by poll
discussionChannelSchema.statics.findByPoll = async function(
  pollId: mongoose.Types.ObjectId
): Promise<IDiscussionChannelDocument[]> {
  return this.find({ poll: pollId }).sort({ lastActivity: -1 });
};

// Static method to find channels by participant
discussionChannelSchema.statics.findByParticipant = async function(
  userId: mongoose.Types.ObjectId
): Promise<IDiscussionChannelDocument[]> {
  return this.find({ participants: userId }).sort({ lastActivity: -1 });
};

// Static method to find active channels
discussionChannelSchema.statics.findActive = async function(): Promise<IDiscussionChannelDocument[]> {
  return this.find({ isActive: true }).sort({ lastActivity: -1 });
};

// Define the model
export const DiscussionChannel = mongoose.model<IDiscussionChannelDocument, mongoose.Model<IDiscussionChannelDocument> & {
  findByPoll(pollId: mongoose.Types.ObjectId): Promise<IDiscussionChannelDocument[]>;
  findByParticipant(userId: mongoose.Types.ObjectId): Promise<IDiscussionChannelDocument[]>;
  findActive(): Promise<IDiscussionChannelDocument[]>;
}>('DiscussionChannel', discussionChannelSchema);
