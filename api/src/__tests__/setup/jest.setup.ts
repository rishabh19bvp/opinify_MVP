import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// Global setup and teardown for MongoDB
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });
  
  // Create necessary indexes
  try {
    // Create collections and indexes explicitly
    if (mongoose.connection.db) {
      if (!(await mongoose.connection.db.listCollections({ name: 'polls' }).hasNext())) {
        await mongoose.connection.db.createCollection('polls');
      }
      await mongoose.connection.db.collection('polls').createIndex({ location: '2dsphere' });
      console.log('Successfully created geospatial index');
    }
  } catch (error: any) {
    console.log('Index setup warning:', error?.message || 'Unknown error');
  }
}, 30000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

// Cleanup function for each test
export const cleanupDatabase = async () => {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB connection not established');
  }

  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length === 0) return;

    for (const collection of collections) {
      if (collection.name !== 'system.indexes') {
        await mongoose.connection.db.dropCollection(collection.name);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ns not found')) {
      // Ignore if collection doesn't exist
      return;
    }
    throw error;
  }
};
