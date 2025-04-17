import express from 'express';
import { 
  getTopHeadlines, 
  searchNews, 
  getNewsById
  // getNewsByTags, // Not implemented, see docs/news-api-flow.md
  // updateReactions // Not implemented, see docs/news-api-flow.md
} from '../controllers/newsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/headlines', getTopHeadlines);
router.get('/search', searchNews);
// router.get('/tags', getNewsByTags); // Not implemented, see docs/news-api-flow.md
router.get('/:id', getNewsById);

// Protected routes
// router.post('/:id/react', authenticate, updateReactions); // Not implemented, see docs/news-api-flow.md

export default router;
