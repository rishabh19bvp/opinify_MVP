"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewsById = exports.searchNews = exports.getTopHeadlines = void 0;
const newsService_1 = require("../services/newsService");
const NewsArticle_1 = require("../models/NewsArticle");
const mongoose_1 = __importDefault(require("mongoose"));
// Initialize the news service
const newsService = new newsService_1.NewsService();
/**
 * Get top headlines
 * @route GET /api/news/headlines
 * @access Public
 */
const getTopHeadlines = async (req, res) => {
    try {
        const { lang = 'en', max, page = '1' } = req.query;
        const limit = max ? parseInt(max) : 20;
        const currentPage = parseInt(page);
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
            NewsArticle_1.NewsArticle.find()
                .sort({ publishedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            NewsArticle_1.NewsArticle.countDocuments()
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
    }
    catch (error) {
        console.error('[NewsController] Error:', error instanceof Error ? error.message : error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch news'
        });
    }
};
exports.getTopHeadlines = getTopHeadlines;
/**
 * Search news articles
 * @route GET /api/news/search
 * @access Public
 */
const searchNews = async (req, res, next) => {
    try {
        const { q, lang, max } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }
        const articles = await newsService.searchNews(q, lang, max ? parseInt(max) : 10);
        return res.status(200).json({
            success: true,
            count: articles.length,
            data: articles
        });
    }
    catch (error) {
        next(error);
    }
};
exports.searchNews = searchNews;
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
const getNewsById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid article ID'
            });
        }
        const article = await NewsArticle_1.NewsArticle.findById(id);
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
    }
    catch (error) {
        next(error);
    }
};
exports.getNewsById = getNewsById;
/**
 * Update article reactions
 * @route POST /api/news/:id/react
 * @access Private
 */
// [NOT IMPLEMENTED] updateReactions is not used because reactions are not currently supported as per docs/news-api-flow.md
// export const updateReactions = ...
