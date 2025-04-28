// User references now use firebaseUid (string) instead of ObjectId.
import mongoose, { Document, Schema } from 'mongoose';
import { IPollDocument } from './Poll';

// Message interface
export interface IMessage {
  sender: string; // firebaseUid
  content: string;
  timestamp: Date;
  readBy: string[];
}

// Message as a document
export interface IMessageDocument extends IMessage, Document {}

// Message schema
const messageSchema = new Schema<IMessageDocument, mongoose.Model<IMessageDocument>>({
  sender: {
    type: String,
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
    type: String
  }]
});

// Discussion channel interface
export interface IDiscussionChannel {
  name: string;
  description?: string;
  poll: mongoose.Types.ObjectId; // still ObjectId for poll reference
  creator: string; // firebaseUid
  participants: string[]; // firebaseUid[]
  messages: IMessage[];
  isActive: boolean;
  lastActivity: Date;
  maxParticipants: number;
}

// Discussion channel as a document
export interface IDiscussionChannelDocument extends Document, IDiscussionChannel {
  addMessage(senderId: string, content: string): Promise<IMessageDocument>;
  addParticipant(userId: string): Promise<boolean>;
  removeParticipant(userId: string): Promise<boolean>;
  markMessageAsRead(userId: string, messageId: mongoose.Types.ObjectId): Promise<boolean>;
  getUnreadCount(userId: string): Promise<number>;
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
    type: String,
    required: [true, 'Creator is required'],
    index: true
  },
  participants: [{
    type: String,
    index: true
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
  senderId: string,
  content: string
): Promise<IMessageDocument> {
  // Check if user is a participant
  if (!this.participants.some((p: string) => p === senderId)) {
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
  userId: string
): Promise<boolean> {
  // Check if user is already a participant
  if (this.participants.some((p: string) => p === userId)) {
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
  userId: string
): Promise<boolean> {
  // Check if user is a participant
  if (!this.participants.some((p: string) => p === userId)) {
    return false;
  }
  
  // Remove user from participants
  this.participants = this.participants.filter((p: string) => p !== userId);
  
  // Save the channel
  await this.save();
  
  return true;
};

// Mark a message as read by a user
discussionChannelSchema.methods.markMessageAsRead = async function(
  userId: string,
  messageId: mongoose.Types.ObjectId
): Promise<boolean> {
  // Check if user is a participant
  if (!this.participants.some((p: string) => p === userId)) {
    return false;
  }
  
  // Find the message
  const message = this.messages.id(messageId);
  if (!message) {
    return false;
  }
  
  // Check if user has already read the message
  if (message.readBy.some((id: string) => id === userId)) {
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
  userId: string
): Promise<number> {
  // Check if user is a participant
  if (!this.participants.some((p: string) => p === userId)) {
    return 0;
  }
  
  // Count messages not read by the user
  return this.messages.filter((m: IMessage) => !m.readBy.some((id: string) => id === userId)).length;
};

// Static method to find channels by poll
discussionChannelSchema.statics.findByPoll = async function(
  pollId: mongoose.Types.ObjectId
): Promise<IDiscussionChannelDocument[]> {
  return this.find({ poll: pollId }).sort({ lastActivity: -1 });
};

// Static method to find channels by participant
discussionChannelSchema.statics.findByParticipant = async function(
  userId: string
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
  findByParticipant(userId: string): Promise<IDiscussionChannelDocument[]>;
  findActive(): Promise<IDiscussionChannelDocument[]>;
}>('DiscussionChannel', discussionChannelSchema);
