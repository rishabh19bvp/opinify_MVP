"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const NewsArticle_1 = require("../models/NewsArticle");
const newsService_1 = require("../services/newsService");
const mongoose_1 = __importDefault(require("mongoose"));
async function connectToMongoDB() {
    console.log('Connecting to MongoDB Atlas...');
    try {
        await mongoose_1.default.connect(config_1.config.database.uri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            autoIndex: true,
            retryWrites: true,
            w: 'majority'
        });
        console.log('MongoDB connection successful!');
        const isConnected = mongoose_1.default.connection.readyState === 1;
        console.log(`MongoDB connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
        return isConnected;
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        return false;
    }
}
async function testNewsAPI() {
    console.log('Starting NewsAPI.org test...');
    // Connect to MongoDB first
    const isConnected = await connectToMongoDB();
    if (!isConnected) {
        console.error('Cannot proceed with test: MongoDB connection failed');
        return;
    }
    // Initialize NewsService
    const newsService = new newsService_1.NewsService();
    try {
        // Test API connection
        console.log('Testing NewsAPI.org connection...');
        await newsService.testApiConnection();
        // Fetch top headlines
        console.log('Fetching top headlines...');
        const articles = await newsService.getTopHeadlines('general', 'en', 10);
        console.log(`Successfully fetched ${articles.length} articles`);
        console.log('First article details:', articles[0]);
        // Verify MongoDB storage
        console.log('Verifying MongoDB storage...');
        const dbArticles = await NewsArticle_1.NewsArticle.find({}).limit(5);
        console.log(`Found ${dbArticles.length} articles in database:`);
        dbArticles.forEach((article, index) => {
            console.log(`Article ${index + 1}:`, {
                title: article.title,
                url: article.url,
                source: article.source.name
            });
        });
        console.log('Test completed successfully!');
    }
    catch (error) {
        console.error('Test failed:', error.message);
        console.error('Error details:', error);
    }
    finally {
        // Close MongoDB connection
        console.log('Closing MongoDB connection...');
        await mongoose_1.default.connection.close();
        console.log('MongoDB connection closed');
    }
}
// Run the test
void testNewsAPI();
