"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscussionChannel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Message schema
const messageSchema = new mongoose_1.Schema({
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }]
});
// Discussion channel schema
const discussionChannelSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Poll',
        required: [true, 'Associated poll is required']
    },
    creator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    },
    participants: [{
            type: mongoose_1.Schema.Types.ObjectId,
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
discussionChannelSchema.methods.addMessage = async function (senderId, content) {
    // Check if user is a participant
    if (!this.participants.some((p) => p.equals(senderId))) {
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
discussionChannelSchema.methods.addParticipant = async function (userId) {
    // Check if user is already a participant
    if (this.participants.some((p) => p.equals(userId))) {
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
discussionChannelSchema.methods.removeParticipant = async function (userId) {
    // Check if user is a participant
    if (!this.participants.some((p) => p.equals(userId))) {
        return false;
    }
    // Remove user from participants
    this.participants = this.participants.filter((p) => !p.equals(userId));
    // Save the channel
    await this.save();
    return true;
};
// Mark a message as read by a user
discussionChannelSchema.methods.markMessageAsRead = async function (userId, messageId) {
    // Check if user is a participant
    if (!this.participants.some((p) => p.equals(userId))) {
        return false;
    }
    // Find the message
    const message = this.messages.id(messageId);
    if (!message) {
        return false;
    }
    // Check if user has already read the message
    if (message.readBy.some((id) => id.equals(userId))) {
        return true;
    }
    // Mark as read
    message.readBy.push(userId);
    // Save the channel
    await this.save();
    return true;
};
// Get count of unread messages for a user
discussionChannelSchema.methods.getUnreadCount = async function (userId) {
    // Check if user is a participant
    if (!this.participants.some((p) => p.equals(userId))) {
        return 0;
    }
    // Count messages not read by the user
    return this.messages.filter((m) => !m.readBy.some((id) => id.equals(userId))).length;
};
// Static method to find channels by poll
discussionChannelSchema.statics.findByPoll = async function (pollId) {
    return this.find({ poll: pollId }).sort({ lastActivity: -1 });
};
// Static method to find channels by participant
discussionChannelSchema.statics.findByParticipant = async function (userId) {
    return this.find({ participants: userId }).sort({ lastActivity: -1 });
};
// Static method to find active channels
discussionChannelSchema.statics.findActive = async function () {
    return this.find({ isActive: true }).sort({ lastActivity: -1 });
};
// Define the model
exports.DiscussionChannel = mongoose_1.default.model('DiscussionChannel', discussionChannelSchema);
