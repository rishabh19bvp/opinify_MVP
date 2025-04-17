import express from 'express';
import {
  createChannel,
  getChannels,
  getChannel,
  joinChannel,
  leaveChannel,
  sendMessage,
  getMessages,
  markMessageAsRead,
  closeChannel
} from '../controllers/discussionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getChannels);
router.get('/:id', getChannel);

// Protected routes
router.post('/', authenticate, createChannel);
router.post('/:id/join', authenticate, joinChannel);
router.post('/:id/leave', authenticate, leaveChannel);
router.post('/:id/messages', authenticate, sendMessage);
router.get('/:id/messages', authenticate, getMessages);
router.post('/:id/messages/:messageId/read', authenticate, markMessageAsRead);
router.put('/:id/close', authenticate, closeChannel);

export default router;
