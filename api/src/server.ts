import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { AddressInfo } from 'net';
import { config } from './config';
import newsRoutes from './routes/newsRoutes';
import authRoutes from './routes/authRoutes';
import pollRoutes from './routes/pollRoutes';
import discussionRoutes from './routes/discussionRoutes';
import { NewsArticle } from './models/NewsArticle';

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:19000',
    'http://192.168.29.215:19000',
    'http://192.168.29.215:19001',
    'exp://192.168.29.215:19000',
    'exp://192.168.29.215:19001'
  ],
  credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  const maxRetries = 3;
  const retryDelay = 5000; // 5 seconds

  // Set up connection events
  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('[MongoDB] MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] MongoDB reconnected');
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log('[MongoDB] Attempting to connect...');
      console.log('[MongoDB] Connection string:', config.database.uri);
      
      await mongoose.connect(config.database.uri, {
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
      const isConnected = mongoose.connection.readyState === 1;
      console.log('[MongoDB] Connection status:', {
        readyState: mongoose.connection.readyState,
        isConnected
      });
      
      // Create indexes if they don't exist
      await NewsArticle.createIndexes();
      
      return;
    } catch (err) {
      console.error(`[MongoDB] Connection attempt ${attempt} failed:`);
      console.error('[MongoDB] Error:', err);
      console.error('[MongoDB] Connection string:', config.database.uri);
      
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
app.use('/api/news', newsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/discussions', discussionRoutes);

// Protected routes
// Add any protected routes here with the authenticate middleware
// app.use('/api/protected', authenticate, protectedRoutes);

// Wait for MongoDB connection before starting server
connectDB().then(() => {
  const port = config.port; // Use port from config
  const server = app.listen(port, '0.0.0.0', () => {
    const address = server.address() as { port: number, address: string, family: string };
    console.log(`Server running on port ${address.port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`MongoDB URI: ${config.database.uri}`);
    console.log(`Listening on all interfaces: http://${address.address}:${address.port}`);
    console.log(`API endpoints available at: http://${address.address}:${address.port}/api`);
  });

  // Add error handling for server
  server.on('error', (error: Error) => {
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
app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});
