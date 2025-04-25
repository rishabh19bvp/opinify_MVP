import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Zod schema for validation
const userSchemaValidator = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers, and underscores'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
  location: z.object({
    latitude: z.number()
      .min(-90, 'Invalid latitude')
      .max(90, 'Invalid latitude'),
    longitude: z.number()
      .min(-180, 'Invalid longitude')
      .max(180, 'Invalid longitude')
  }).optional(),
  profile: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    bio: z.string().max(200).optional(),
    avatarUrl: z.string().url().optional()
  }).optional()
});

// Mongoose schema
const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username must be at most 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  location: {
    latitude: {
      type: Number,
      min: -90,
      max: 90,
      validate: {
        validator: function(v: number) {
          return v >= -90 && v <= 90;
        },
        message: 'Invalid latitude'
      }
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
      validate: {
        validator: function(v: number) {
          return v >= -180 && v <= 180;
        },
        message: 'Invalid longitude'
      }
    }
  },
  profile: {
    firstName: {
      type: String,
      maxlength: 50
    },
    lastName: {
      type: String,
      maxlength: 50
    },
    bio: {
      type: String,
      maxlength: 200
    },
    avatarUrl: {
      type: String,
      validate: {
        validator: function(v: string) {
          const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})[/\w .-]*\/?(?:[?&](?:\w+=\w+)(?:&|$))*$/;
          return urlRegex.test(v);
        },
        message: 'Invalid URL format'
      }
    }
  },
  pollsVoted: { type: Number, default: 0 },
  groupsCount: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(this: Document & { password: string }) {
  if (!this.isModified('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(this: Document & { password: string }, candidatePassword: string) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to validate user data
userSchema.statics.validateData = function(this: Model<Document & { password: string }>, data: any) {
  try {
    return userSchemaValidator.parse(data);
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

// Interface for User document
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  };
  pollsVoted?: number;
  groupsCount?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Interface for User model
export interface IUserModel extends Model<IUser> {
  validateData(data: any): Promise<any>;
}

// Create and export the model
export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
