import axios from 'axios';
import { config } from '../config';
import { NewsArticle } from '../models/NewsArticle';
import { NewsService } from '../services/newsService';
import mongoose from 'mongoose';

async function connectToMongoDB() {
  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(config.database.uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      autoIndex: true,
      retryWrites: true,
      w: 'majority'
    });
    console.log('MongoDB connection successful!');
    const isConnected = mongoose.connection.readyState === 1;
    console.log(`MongoDB connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
    return isConnected;
  } catch (error) {
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
  const newsService = new NewsService();
  
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
    const dbArticles = await NewsArticle.find({}).limit(5);
    console.log(`Found ${dbArticles.length} articles in database:`);
    dbArticles.forEach((article, index) => {
      console.log(`Article ${index + 1}:`, {
        title: article.title,
        url: article.url,
        source: article.source.name
      });
    });
    
    console.log('Test completed successfully!');
  } catch (error: any) {
    console.error('Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    // Close MongoDB connection
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
void testNewsAPI();
