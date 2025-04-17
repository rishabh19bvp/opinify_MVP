/**
 * News Controller
 *
 * Implements the News API flow as described in docs/news-api-flow.md:
 * 1. Fetch news from external API (GNews)
 * 2. Store news in the MongoDB database
 * 3. Serve news from the database to the frontend
 *
 * NOTE: Sorting/filtering by category and reactions is NOT implemented as per current requirements.
 *
 * For more details, see: ../docs/news-api-flow.md
 */
import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../services/newsService';
import { NewsArticle } from '../models/NewsArticle';
import mongoose from 'mongoose';

// Initialize the news service
const newsService = new NewsService();

/**
 * Get top headlines
 * @route GET /api/news/headlines
 * @access Public
 */
export const getTopHeadlines = async (req: Request, res: Response) => {
  try {
    const { lang = 'en', max, page = '1' } = req.query;
    const limit = max ? parseInt(max as string) : 20;
    const currentPage = parseInt(page as string);

    // Validate parameters
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be between 1 and 100'
      });
    }

    if (isNaN(currentPage) || currentPage < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page. Must be greater than 0'
      });
    }

    // Calculate skip for pagination
    const skip = (currentPage - 1) * limit;
    // Query the database for paginated articles and total count
    const [articles, totalCount] = await Promise.all([
      NewsArticle.find()
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NewsArticle.countDocuments()
    ]);

    // Log request and response info for debugging
    console.log('[getTopHeadlines]', {
      lang,
      max: limit,
      page: currentPage,
      skip,
      articlesReturned: articles.length,
      totalCount
    });
    // Return response with pagination info
    return res.json({
      success: true,
      count: totalCount,
      currentPage,
      totalPages: Math.ceil(totalCount / limit),
      data: articles,
      message: 'News articles retrieved successfully'
    });
  } catch (error) {
    console.error('[NewsController] Error:', error instanceof Error ? error.message : error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch news'
    });
  }
};

/**
 * Search news articles
 * @route GET /api/news/search
 * @access Public
 */
export const searchNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, lang, max } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const articles = await newsService.searchNews(
      q as string,
      lang as string,
      max ? parseInt(max as string) : 10
    );
    
    return res.status(200).json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    next(error);
  }
};



/**
 * Get news by tags
 * @route GET /api/news/tags
 * @access Public
 */
// [NOT IMPLEMENTED] getNewsByTags is not used because sorting/filtering by tags/category is not currently supported as per docs/news-api-flow.md
// export const getNewsByTags = ...

/**
 * Get a single news article by ID
 * @route GET /api/news/:id
 * @access Public
 */
export const getNewsById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid article ID'
      });
    }
    
    const article = await NewsArticle.findById(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update article reactions
 * @route POST /api/news/:id/react
 * @access Private
 */
// [NOT IMPLEMENTED] updateReactions is not used because reactions are not currently supported as per docs/news-api-flow.md
// export const updateReactions = ...
