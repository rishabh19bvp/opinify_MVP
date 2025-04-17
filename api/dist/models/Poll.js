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
exports.Poll = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Geospatial index for location-based queries
const optionSchema = new mongoose_1.Schema({
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
const pollSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    },
    expiresAt: {
        type: Date,
        required: [true, 'Expiration date is required'],
        validate: {
            validator: function (v) {
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
                type: mongoose_1.Schema.Types.ObjectId,
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
pollSchema.methods.isExpired = function () {
    return new Date(this.expiresAt) < new Date();
};
// Check if user can vote
pollSchema.methods.canVote = async function (userId) {
    const vote = await exports.Poll.findOne({
        _id: this._id,
        'votes.userId': userId
    });
    return !vote;
};
// Add pre-save hook to automatically update poll status
pollSchema.pre('save', function (next) {
    if (this.isModified('expiresAt') || this.isNew) {
        if (this.expiresAt < new Date()) {
            this.status = 'expired';
        }
    }
    next();
});
// Create and export the model
exports.Poll = mongoose_1.default.model('Poll', pollSchema);
