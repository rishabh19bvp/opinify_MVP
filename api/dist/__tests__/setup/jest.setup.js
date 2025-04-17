"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
let mongoServer;
// Global setup and teardown for MongoDB
beforeAll(async () => {
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose_1.default.connect(uri, {
        serverSelectionTimeoutMS: 10000
    });
    // Create necessary indexes
    try {
        // Create collections and indexes explicitly
        if (mongoose_1.default.connection.db) {
            if (!(await mongoose_1.default.connection.db.listCollections({ name: 'polls' }).hasNext())) {
                await mongoose_1.default.connection.db.createCollection('polls');
            }
            await mongoose_1.default.connection.db.collection('polls').createIndex({ location: '2dsphere' });
            console.log('Successfully created geospatial index');
        }
    }
    catch (error) {
        console.log('Index setup warning:', error?.message || 'Unknown error');
    }
}, 30000);
afterAll(async () => {
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
}, 30000);
// Cleanup function for each test
const cleanupDatabase = async () => {
    if (!mongoose_1.default.connection.db) {
        throw new Error('MongoDB connection not established');
    }
    try {
        const collections = await mongoose_1.default.connection.db.listCollections().toArray();
        if (collections.length === 0)
            return;
        for (const collection of collections) {
            if (collection.name !== 'system.indexes') {
                await mongoose_1.default.connection.db.dropCollection(collection.name);
            }
        }
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('ns not found')) {
            // Ignore if collection doesn't exist
            return;
        }
        throw error;
    }
};
exports.cleanupDatabase = cleanupDatabase;
