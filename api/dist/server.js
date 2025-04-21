"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
const newsRoutes_1 = __importDefault(require("./routes/newsRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const NewsArticle_1 = require("./models/NewsArticle");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:19000', 'http://192.168.29.53:19000', 'http://192.168.29.53:19001'],
    credentials: true
}));
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Database connection
const connectDB = async () => {
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds
    // Set up connection events
    mongoose_1.default.connection.on('connected', () => {
        console.log('[MongoDB] Connected to MongoDB');
    });
    mongoose_1.default.connection.on('error', (err) => {
        console.error('[MongoDB] Connection error:', err);
    });
    mongoose_1.default.connection.on('disconnected', () => {
        console.log('[MongoDB] MongoDB disconnected');
    });
    mongoose_1.default.connection.on('reconnected', () => {
        console.log('[MongoDB] MongoDB reconnected');
    });
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log('[MongoDB] Attempting to connect...');
            console.log('[MongoDB] Connection string:', config_1.config.database.uri);
            await mongoose_1.default.connect(config_1.config.database.uri, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                autoIndex: true,
                retryWrites: true,
                w: 'majority'
            });
            console.log('[MongoDB] Connection successful!');
            console.log('[MongoDB] Connection options:', {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                autoIndex: true,
                retryWrites: true,
                w: 'majority'
            });
            // Check connection status
            const isConnected = mongoose_1.default.connection.readyState === 1;
            console.log('[MongoDB] Connection status:', {
                readyState: mongoose_1.default.connection.readyState,
                isConnected
            });
            // Create indexes if they don't exist
            await NewsArticle_1.NewsArticle.createIndexes();
            return;
        }
        catch (err) {
            console.error(`[MongoDB] Connection attempt ${attempt} failed:`);
            console.error('[MongoDB] Error:', err);
            console.error('[MongoDB] Connection string:', config_1.config.database.uri);
            if (attempt === maxRetries) {
                console.error('[MongoDB] Max retries reached. Exiting...');
                throw err;
            }
            console.log(`[MongoDB] Retrying in ${retryDelay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
};
// Initialize Firebase
// Public routes
app.use('/api/news', newsRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
// Protected routes
// Add any protected routes here with the authenticate middleware
// app.use('/api/protected', authenticate, protectedRoutes);
// Wait for MongoDB connection before starting server
connectDB().then(() => {
    const port = config_1.config.port; // Use port from config
    const server = app.listen(port, '0.0.0.0', () => {
        const address = server.address();
        console.log(`Server running on port ${address.port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`MongoDB URI: ${config_1.config.database.uri}`);
        console.log(`Listening on all interfaces: http://localhost:${address.port}`);
        console.log(`API endpoints available at: http://localhost:${address.port}/api`);
    });
    // Add error handling for server
    server.on('error', (error) => {
        console.error('Server Error:', error);
        process.exit(1);
    });
    // Handle process termination
    process.on('SIGTERM', () => {
        server.close(() => {
            console.log('Server terminated');
            process.exit(0);
        });
    });
}).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Error handling middleware
app.use((err, _req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});
