import axios from 'axios';
import { config } from '../config';
import { NewsArticle, INewsArticle } from '../models/NewsArticle';
import mongoose from 'mongoose';

// Define the NewsAPI.org response types
interface NewsAPIArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
    url: string;
  };
}

interface NewsAPISource {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  language: string;
  country: string;
}

interface NewsAPISourcesResponse {
  status: string;
  sources: NewsAPISource[];
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

// Define the GNews API response types
interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

/**
 * Service for handling news article operations and NewsAPI.org integration
 */
export class NewsService {
  private apiKey: string;
  private baseUrl: string;
  private cacheTime: number;
  private lastFetch: Date | null;
  private isFetching: boolean;

  constructor() {
    this.apiKey = process.env.NEWSAPI_API_KEY || config.newsapi.apiKey;
    if (!this.apiKey) {
      throw new Error('NewsAPI.org API key is required');
    }
    this.baseUrl = 'https://newsapi.org/v2';
    this.cacheTime = 60 * 60 * 1000; // 1 hour cache by default
    this.lastFetch = null;
    this.isFetching = false;
  }

  public async testApiConnection(): Promise<void> {
    try {
      // First get list of Indian news sources
      const sourcesUrl = `${this.baseUrl}/sources`;
      const sourcesParams = {
        apiKey: this.apiKey,
        language: 'en'
      };
      
      console.log("[NewsService] Fetching sources from:", sourcesUrl);
      const sourcesResponse = await axios.get<NewsAPISourcesResponse>(sourcesUrl, { params: sourcesParams });
      if (!sourcesResponse.data.sources) {
        throw new Error('No sources found in response');
      }
      console.log("[NewsService] Sources Response:", sourcesResponse.data);
      
      // Get top headlines from those sources
      const testUrl = `${this.baseUrl}/top-headlines`;
      const params = {
        apiKey: this.apiKey,
        sources: sourcesResponse.data.sources.map((source: NewsAPISource) => source.id).join(','),
        pageSize: 10,
        page: 1
      };
      
      console.log("[NewsService] NewsAPI.org URL:", testUrl);
      console.log("[NewsService] Test params:", params);
      
      const response = await axios.get<NewsAPIResponse>(testUrl, { params });
      console.log("[NewsService] NewsAPI.org Response:", response.data);
      
      if (response.data.articles && response.data.articles.length > 0) {
        console.log("[NewsService] First article:", response.data.articles[0]);
      }
    } catch (error: any) {
      console.error("[NewsService] NewsAPI.org Error:", error.message);
      if (error.response) {
        console.error("[NewsService] NewsAPI.org Error Response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      throw error;
    }
  }

  /**
   * Check if we can make another API request
   */
  private canMakeRequest(): boolean {
    // Always allow requests since we're not tracking daily limits
    return true;
  }
  
  /**
   * Extract tags from text
   */
  private extractTags(text: string): string[] {
    if (!text) return [];
    
    // Simple tag extraction - could be improved with NLP
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'like'];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 3 && !commonWords.includes(word)) // Filter short words and common words
      .slice(0, 10); // Take max 10 tags
  }
  
  /**
   * Process and save articles from NewsAPI.org
   */
  private async processAndSaveArticles(articles: NewsAPIArticle[]): Promise<INewsArticle[]> {
    const savedArticles: INewsArticle[] = [];
    
    for (const article of articles) {
      try {
        // Extract tags from title and description
        const titleTags = this.extractTags(article.title);
        const descriptionTags = this.extractTags(article.description);
        
        // Combine and deduplicate tags
        const allTags = [...new Set([...titleTags, ...descriptionTags])];
        
        try {
          // Check MongoDB connection status
          const isConnected = mongoose.connection.readyState === 1;
          console.log('[NewsService] MongoDB connection status:', {
            readyState: mongoose.connection.readyState,
            isConnected
          });

          if (!isConnected) {
            console.error('[NewsService] MongoDB is not connected!');
            throw new Error('MongoDB connection lost');
          }

          // Log article details before processing
          console.log('[NewsService] Processing article:', {
            title: article.title,
            url: article.url,
            source: article.source
          });
          const savedArticle = await NewsArticle.create({
            title: article.title,
            description: article.description || '',
            content: article.content || '',
            url: article.url,
            urlToImage: article.urlToImage || '',
            publishedAt: new Date(article.publishedAt || Date.now()),
            source: {
              id: article.source.id || '',
              name: article.source.name || '',
              url: article.source.url || article.url // Fallback to article URL if source URL is missing
            },
            tags: allTags
          });
          savedArticles.push(savedArticle);
          console.log('[NewsService] Article created successfully');
        } catch (error) {
          console.error('[NewsService] Detailed error saving article:', {
            url: article.url,
            source: article.source,
            error: error instanceof Error ? {
              message: error.message,
              stack: error.stack,
              name: error.name
            } : {
              message: 'Unknown error',
              type: typeof error
            }
          });
          throw error; // Re-throw to be caught by outer try-catch
        }
      } catch (error) {
        console.error('[NewsService] Outer error saving article:', {
          url: article.url,
          source: article.source,
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : {
            message: 'Unknown error',
            type: typeof error
          }
        });
        // Continue with the next article
      }
    }
    console.log(`[NewsService] Finished processing articles. Successfully saved: ${savedArticles.length}`);
    return savedArticles;
  }

  /**
   * Fetch top headlines from NewsAPI.org or database cache
   */
  public async getTopHeadlines(category?: string, lang: string = 'en', limit: number = 20): Promise<INewsArticle[]> {
    try {
      // Check if we have cached articles in MongoDB
      const cachedArticles = await NewsArticle.find()
        .sort({ publishedAt: -1 })
        .limit(limit)
        .lean();

      const now = new Date();
      const shouldFetch = !this.lastFetch || 
                        (now.getTime() - this.lastFetch.getTime() > this.cacheTime) || 
                        cachedArticles.length < limit;

      // Return cached articles immediately if they're fresh enough
      if (!shouldFetch) {
        console.log('[NewsService] Returning cached articles');
        return cachedArticles;
      }

      // If another fetch is in progress, return cached articles
      if (this.isFetching) {
        console.log('[NewsService] Fetch in progress, returning cached articles');
        return cachedArticles;
      }

      // Set fetching flag
      this.isFetching = true;

      try {
        // First get list of news sources
        const sourcesUrl = `${this.baseUrl}/sources`;
        const sourcesParams = {
          apiKey: this.apiKey,
          language: lang
        };
        
        const sourcesResponse = await axios.get<NewsAPISourcesResponse>(sourcesUrl, { params: sourcesParams });
        if (!sourcesResponse.data.sources) {
          throw new Error('No sources found in response');
        }
        
        // Get top headlines
        const params = {
          apiKey: this.apiKey,
          sources: sourcesResponse.data.sources.map((source: NewsAPISource) => source.id).join(','),
          pageSize: Math.min(100, limit * 2), // Fetch more than needed to ensure we have enough after filtering
          language: lang
        };

        // Make the API request
        const response = await axios.get<NewsAPIResponse>(`${this.baseUrl}/top-headlines`, { params });

        if (response.data.status !== 'ok') {
          throw new Error(`NewsAPI.org error: ${response.data.status}`);
        }

        // Process and save articles
        const articles = await this.processAndSaveArticles(response.data.articles);
        console.log(`[NewsService] Successfully processed and saved ${articles.length} articles`);

        // Update last fetch time
        this.lastFetch = now;

        // Get fresh articles from database
        const freshArticles = await NewsArticle.find()
          .sort({ publishedAt: -1 })
          .limit(limit)
          .lean();

        return freshArticles;
      } finally {
        // Reset fetching flag
        this.isFetching = false;
      }
    } catch (error: any) {
      console.error('[NewsService] Error fetching news:', error);
      throw error;
    }
  }

  /**
   * Search for news articles by query
   */
  async searchNews(query: string, lang: string = 'en', max: number = 20): Promise<INewsArticle[]> {
    try {
      // First try to search in cached articles
      const articles = await NewsArticle.find({
        $text: { $search: query }
      })
      .sort({ publishedAt: -1 })
      .limit(max);

      // If we have enough results, return them
      if (articles.length >= 5) {
        return articles;
      }

      // Fetch fresh articles from NewsAPI.org
      try {
        const response = await axios.get<NewsAPIResponse>(`${this.baseUrl}/top-headlines`, {
          params: {
            apiKey: this.apiKey,
            language: lang || 'en',
            country: 'in',
            category: undefined,
            pageSize: max
          }
        });

        if (response.data.status !== 'ok') {
          throw new Error(`NewsAPI.org error: ${response.data.status}`);
        }

        // Process and save articles
        const articles = await this.processAndSaveArticles(response.data.articles);
        return articles;
      } catch (apiError: any) {
        console.error('[NewsService] NewsAPI.org error:', apiError.message);
        
        // If we have any cached articles, return them as fallback
        if (articles.length > 0) {
          console.log('[NewsService] Returning cached articles as fallback after API error');
          return articles;
        }
        
        throw apiError;
      }
    } catch (error: any) {
      console.error('[NewsService] Search error:', error.message);
      throw error;
    }
  }
}
