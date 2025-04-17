import mongoose from 'mongoose';
import { NewsArticle } from '../models/NewsArticle';
import { config } from '../config';

async function testDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.database.uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      autoIndex: true,
      retryWrites: true,
      w: 'majority'
    });

    console.log('Connected to MongoDB');

    // Count articles
    const articleCount = await NewsArticle.countDocuments();
    console.log(`Total articles in database: ${articleCount}`);

    // Get latest 5 articles
    const latestArticles = await NewsArticle.find()
      .sort({ publishedAt: -1 })
      .limit(5)
      .lean();

    console.log('\nLatest 5 articles:');
    latestArticles.forEach((article, index) => {
      console.log(`\nArticle ${index + 1}:`);
      console.log(`Title: ${article.title}`);
      console.log(`URL: ${article.url}`);
      console.log(`Published: ${article.publishedAt}`);
      console.log(`Source: ${article.source.name}`);
      console.log(`Tags: ${article.tags.join(', ')}`);
    });

  } catch (error) {
    console.error('Error testing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testDatabase();
