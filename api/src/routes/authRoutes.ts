import express from 'express';
import { register, login, getMe, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
// router.post('/reset-password', resetPassword); // [Password reset archived: now handled by Firebase Auth]

// Protected routes
router.get('/me', authenticate, getMe);

export default router;
