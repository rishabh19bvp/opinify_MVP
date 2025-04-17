"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearDatabase = exports.closeDatabase = exports.connect = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
let mongoServer = null;
let isConnected = false;
/**
 * Connect to the in-memory database.
 */
const connect = async () => {
    if (isConnected) {
        return;
    }
    try {
        // Close any existing connection first
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
        }
        // Create a new server
        mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        // Connect with a timeout to avoid hanging
        await Promise.race([
            mongoose_1.default.connect(uri),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 10000))
        ]);
        isConnected = true;
        console.log('MongoDB Memory Server connected');
    }
    catch (error) {
        console.error('MongoDB Memory Server connection error:', error);
        throw error;
    }
};
exports.connect = connect;
/**
 * Drop database, close the connection and stop mongod.
 */
const closeDatabase = async () => {
    if (!isConnected) {
        return;
    }
    try {
        // Timeout to avoid hanging
        await Promise.race([
            (async () => {
                if (mongoose_1.default.connection.readyState !== 0) {
                    await mongoose_1.default.connection.dropDatabase();
                    await mongoose_1.default.disconnect();
                }
                if (mongoServer) {
                    await mongoServer.stop();
                    mongoServer = null;
                }
            })(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Cleanup timeout')), 10000))
        ]);
        isConnected = false;
        console.log('MongoDB Memory Server disconnected');
    }
    catch (error) {
        console.error('MongoDB Memory Server cleanup error:', error);
        // Force cleanup if there's an error
        mongoose_1.default.connection.close();
        if (mongoServer)
            mongoServer.stop();
        mongoServer = null;
        isConnected = false;
    }
};
exports.closeDatabase = closeDatabase;
/**
 * Remove all the data for all db collections.
 */
const clearDatabase = async () => {
    if (!isConnected)
        return;
    try {
        const collections = mongoose_1.default.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    }
    catch (error) {
        console.error('Error clearing database:', error);
    }
};
exports.clearDatabase = clearDatabase;
