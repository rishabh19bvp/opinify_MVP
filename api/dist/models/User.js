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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
// Zod schema for validation
const userSchemaValidator = zod_1.z.object({
    username: zod_1.z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers, and underscores'),
    email: zod_1.z.string()
        .email('Invalid email address')
        .toLowerCase(),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
    location: zod_1.z.object({
        latitude: zod_1.z.number()
            .min(-90, 'Invalid latitude')
            .max(90, 'Invalid latitude'),
        longitude: zod_1.z.number()
            .min(-180, 'Invalid longitude')
            .max(180, 'Invalid longitude')
    }).optional(),
    profile: zod_1.z.object({
        firstName: zod_1.z.string().min(1).max(50).optional(),
        lastName: zod_1.z.string().min(1).max(50).optional(),
        bio: zod_1.z.string().max(200).optional(),
        avatarUrl: zod_1.z.string().url().optional()
    }).optional()
});
// Mongoose schema
const userSchema = new mongoose_1.Schema({
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
            validator: function (v) {
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
                validator: function (v) {
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
                validator: function (v) {
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
                validator: function (v) {
                    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})[/\w .-]*\/?(?:[?&](?:\w+=\w+)(?:&|$))*$/;
                    return urlRegex.test(v);
                },
                message: 'Invalid URL format'
            }
        }
    },
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
userSchema.pre('save', async function () {
    if (!this.isModified('password'))
        return;
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
    }
    catch (error) {
        throw new Error('Password hashing failed');
    }
});
// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    catch (error) {
        throw new Error('Password comparison failed');
    }
};
// Method to validate user data
userSchema.statics.validateData = function (data) {
    try {
        return userSchemaValidator.parse(data);
    }
    catch (error) {
        throw new Error(error.message);
    }
};
// Create and export the model
exports.User = mongoose_1.default.model('User', userSchema);
