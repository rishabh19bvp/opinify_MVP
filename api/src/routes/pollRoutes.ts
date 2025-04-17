import express from 'express';
import {
  createPoll,
  getPolls,
  getPollById,
  getNearbyPolls,
  votePoll,
  getPollsByUser,
  getPollsByCategory,
  deletePoll
} from '../controllers/pollController';
import { authenticate } from '../middleware/auth'; // fixed path

const router = express.Router();

// Public routes
router.get('/', getPolls);
router.get('/nearby', getNearbyPolls);
router.get('/:id', getPollById);
router.get('/user/:userId', getPollsByUser);
router.get('/category/:category', getPollsByCategory);

// Protected routes
router.post('/', authenticate, createPoll);
router.post('/:id/vote', authenticate, votePoll);
router.delete('/:id', authenticate, deletePoll);

export default router;
