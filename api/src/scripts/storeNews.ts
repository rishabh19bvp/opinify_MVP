import mongoose from 'mongoose';
import { NewsArticle } from '../models/NewsArticle';
import { NewsService } from '../services/newsService';

async function storeNewsArticles() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      autoIndex: true,
      retryWrites: true,
      w: 'majority'
    });

    console.log('Connected to MongoDB');

    // Create a new NewsService instance
    const newsService = new NewsService();

    console.log('Fetching and storing news articles...');
    
    // Fetch and store articles
    const articles = await newsService.getTopHeadlines(undefined, 'en', 10);
    
    console.log(`Successfully stored ${articles.length} articles`);
    
    // Get all articles from database to verify
    const allArticles = await NewsArticle.find().sort({ publishedAt: -1 }).lean();
    console.log(`\nTotal articles in database: ${allArticles.length}`);
    
    // Print the first article's details
    if (allArticles.length > 0) {
      const firstArticle = allArticles[0];
      console.log('\nFirst article details:');
      console.log('Title:', firstArticle.title);
      console.log('URL:', firstArticle.url);
      console.log('Source:', firstArticle.source.name);
      console.log('Published:', firstArticle.publishedAt);
      console.log('Tags:', firstArticle.tags.join(', '));
    }

  } catch (error) {
    console.error('Error storing news articles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

storeNewsArticles();
