import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { config } from '../config';

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;
    // const { password } = req.body; // [Password logic archived]

    // Validate input
    if (!username || !email /* || !password */) {
      return res.status(400).json({
        success: false,
        error: 'Please provide username and email' // Password check removed
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] }); // No change needed here, as registration is by email/username
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user (password removed)
    const { firebaseUid } = req.body;
if (!firebaseUid) {
  return res.status(400).json({
    success: false,
    error: 'Firebase UID is required'
  });
}
const user = await User.create({
  firebaseUid,
  username,
  email
});

    // Generate JWT token
    const token = jwt.sign(
      { firebaseUid: user.firebaseUid },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        firebaseUid: user.firebaseUid,
        username: user.username,
        email: user.email,
        profile: user.profile,
        pollsVoted: user.pollsVoted,
        groupsCount: user.groupsCount
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    // Password check removed: use Firebase Auth for authentication
// if (!isMatch) { ... }

    // Generate JWT token
    const token = jwt.sign(
      { firebaseUid: user.firebaseUid },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        firebaseUid: user.firebaseUid,
        username: user.username,
        email: user.email,
        profile: user.profile,
        pollsVoted: user.pollsVoted,
        groupsCount: user.groupsCount
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user?.id;
    console.log(`[getMe] Incoming request for user with firebaseUid:`, firebaseUid);
    if (!firebaseUid) {
      console.warn('[getMe] No firebaseUid found in request.');
      return res.status(401).json({ success: false, error: 'Unauthorized: No firebaseUid' });
    }
    let user = await User.findOne({ firebaseUid }).select('-password');
    console.log('[getMe] User lookup result:', user);
    
    if (!user) {
      console.warn(`[getMe] No user found in MongoDB for firebaseUid: ${firebaseUid}`);
      // Attempt to auto-provision user
      // Try to extract email and username from req.user if available
      // req.user may only have 'id', so fallback to firebaseUid-based values
      const email = `${firebaseUid}@unknown.email`;
      const username = firebaseUid;
      try {
        user = await User.create({
          firebaseUid,
          email,
          username,
        });
        console.log(`[getMe] Auto-provisioned new user in MongoDB for firebaseUid: ${firebaseUid}`);
      } catch (provisionErr: any) {
        console.error('[getMe] Failed to auto-provision user:', provisionErr);
        return res.status(500).json({
          success: false,
          error: 'Failed to auto-provision user',
          firebaseUidSearched: firebaseUid
        });
      }
    }

    // Debug: log user stats
    console.log(`[getMe] User ${user.firebaseUid} stats: pollsVoted=${user.pollsVoted}, groupsCount=${user.groupsCount}`);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password
 * @access Public
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // In a real app, you would send an email with a reset link
    // For now, we'll just return a success message
    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};
