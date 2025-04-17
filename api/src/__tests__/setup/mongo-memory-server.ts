import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;
let isConnected = false;

/**
 * Connect to the in-memory database.
 */
export const connect = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  try {
    // Close any existing connection first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Create a new server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect with a timeout to avoid hanging
    await Promise.race([
      mongoose.connect(uri),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]);

    isConnected = true;
    console.log('MongoDB Memory Server connected');
  } catch (error) {
    console.error('MongoDB Memory Server connection error:', error);
    throw error;
  }
};

/**
 * Drop database, close the connection and stop mongod.
 */
export const closeDatabase = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  try {
    // Timeout to avoid hanging
    await Promise.race([
      (async () => {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.dropDatabase();
          await mongoose.disconnect();
        }
        if (mongoServer) {
          await mongoServer.stop();
          mongoServer = null;
        }
      })(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cleanup timeout')), 10000)
      )
    ]);

    isConnected = false;
    console.log('MongoDB Memory Server disconnected');
  } catch (error) {
    console.error('MongoDB Memory Server cleanup error:', error);
    // Force cleanup if there's an error
    mongoose.connection.close();
    if (mongoServer) mongoServer.stop();
    mongoServer = null;
    isConnected = false;
  }
};

/**
 * Remove all the data for all db collections.
 */
export const clearDatabase = async (): Promise<void> => {
  if (!isConnected) return;
  
  try {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};
