"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = exports.ValidationError = exports.AuthenticationError = void 0;
const User_1 = require("../models/User");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose")); // Import mongoose
// Custom error classes for better error handling
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
// Input validation schemas
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
const registerSchema = zod_1.z.object({
    username: zod_1.z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers, and underscores'),
    email: zod_1.z.string().email('Invalid email address'),
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
class AuthService {
    constructor() { }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    generateTokens(userId) {
        try {
            const token = jsonwebtoken_1.default.sign({ userId }, config_1.config.jwt.secret, {
                expiresIn: parseInt(config_1.config.jwt.expiresIn),
                algorithm: 'HS256'
            });
            const refreshToken = jsonwebtoken_1.default.sign({ userId }, config_1.config.jwt.secret, {
                expiresIn: parseInt(config_1.config.jwt.refreshExpiresIn),
                algorithm: 'HS256'
            });
            return { token, refreshToken };
        }
        catch (error) {
            throw new AuthenticationError('Token generation failed');
        }
    }
    async register(userData) {
        try {
            // Validate input data
            const validatedData = registerSchema.parse(userData);
            // Check if user already exists
            const existingUser = await User_1.User.findOne({
                $or: [
                    { email: validatedData.email },
                    { username: validatedData.username }
                ]
            });
            if (existingUser) {
                throw new AuthenticationError(existingUser.email === validatedData.email
                    ? 'Email already registered'
                    : 'Username already taken');
            }
            // Create new user
            const user = await User_1.User.create(validatedData);
            // Generate tokens
            const { token, refreshToken } = this.generateTokens(user._id.toString());
            return {
                token,
                refreshToken,
                user: user.toObject()
            };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new ValidationError(error.errors[0].message);
            }
            throw error;
        }
    }
    async login(credentials) {
        try {
            // Validate input data
            const validatedCredentials = loginSchema.parse(credentials);
            // Find user by email
            const user = await User_1.User.findOne({ email: validatedCredentials.email });
            if (!user) {
                throw new AuthenticationError('Invalid credentials');
            }
            // Verify password
            const isMatch = await user.comparePassword(validatedCredentials.password);
            if (!isMatch) {
                throw new AuthenticationError('Invalid credentials');
            }
            // Generate tokens
            const { token, refreshToken } = this.generateTokens(user._id.toString());
            return {
                token,
                refreshToken,
                user: user.toObject()
            };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new ValidationError(error.errors[0].message);
            }
            throw error;
        }
    }
    async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            // Add validation for ObjectId
            if (!mongoose_1.default.Types.ObjectId.isValid(decoded.userId)) {
                throw new AuthenticationError('Invalid user ID format');
            }
            const user = await User_1.User.findById(decoded.userId);
            if (!user) {
                throw new AuthenticationError('User not found');
            }
            return user.toObject();
        }
        catch (error) {
            if (error instanceof AuthenticationError) {
                throw error;
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new AuthenticationError('Invalid or expired token');
            }
            throw error;
        }
    }
}
exports.AuthService = AuthService;
// Export singleton instance
exports.authService = AuthService.getInstance();
