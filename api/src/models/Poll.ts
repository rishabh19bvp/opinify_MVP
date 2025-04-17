import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { User } from './User';

// Geospatial index for location-based queries
const optionSchema = new Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxlength: [100, 'Option text must be at most 100 characters']
  },
  count: {
    type: Number,
    default: 0,
    min: [0, 'Option count must be a non-negative integer']
  }
});

const pollSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title must be at most 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description must be at most 500 characters']
  },
  options: [optionSchema],
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    validate: {
      validator: function(v: Date) {
        return v > new Date();
      },
      message: 'Expiration date must be in the future'
    }
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'deleted'],
    default: 'active'
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category must be at most 50 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag must be at most 50 characters']
  }],
  votes: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    optionIndex: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Check if poll is expired
pollSchema.methods.isExpired = function(): boolean {
  return new Date(this.expiresAt) < new Date();
};

// Check if user can vote
pollSchema.methods.canVote = async function(userId: mongoose.Types.ObjectId): Promise<boolean> {
  const vote = await Poll.findOne({
    _id: this._id,
    'votes.userId': userId
  });

  return !vote;
};

// Add pre-save hook to automatically update poll status
pollSchema.pre<IPollDocument>('save', function(next) {
  if (this.isModified('expiresAt') || this.isNew) {
    if (this.expiresAt < new Date()) {
      this.status = 'expired';
    }
  }
  next();
});

// Create and export the model
export const Poll = mongoose.model<IPollDocument, IPollModel>('Poll', pollSchema);

// Export interfaces
export interface IPoll {
  title: string;
  description: string;
  options: {
    text: string;
    count: number;
  }[];
  creator: Types.ObjectId;
  expiresAt: Date;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'expired' | 'deleted';
  category?: string;
  tags?: string[];
  votes?: {
    userId: Types.ObjectId;
    optionIndex: number;
  }[];
}

export interface IPollDocument extends IPoll, Document {
  isExpired(): boolean;
  canVote(userId: mongoose.Types.ObjectId): Promise<boolean>;
}

export interface IPollModel extends mongoose.Model<IPollDocument> {
  findByCreator(creatorId: mongoose.Types.ObjectId): Promise<IPollDocument[]>;
  findByCategory(category: string): Promise<IPollDocument[]>;
}

export interface CreatePollInput {
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  options: {
    text: string;
  }[];
  expiresAt: Date;
  category?: string;
  tags?: string[];
}

export interface UpdatePollInput {
  title?: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  options?: {
    id: string;
    text: string;
  }[];
  expiresAt?: Date;
  category?: string;
  tags?: string[];
}
