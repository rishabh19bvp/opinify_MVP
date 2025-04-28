import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Optionally add databaseURL if needed
  });
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies Firebase ID token and attaches user to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const now = new Date().toISOString();
  console.log(`[AUTH] [${now}] Incoming request: ${req.method} ${req.originalUrl}`);
  console.log(`[AUTH] [${now}] Headers:`, req.headers);
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log(`[AUTH] [${now}] Extracted Bearer token.`);
    } else {
      console.warn(`[AUTH] [${now}] No Bearer token found in Authorization header.`);
    }

    // Check if token exists
    if (!token) {
      console.warn(`[AUTH] [${now}] No token provided. Returning 401.`);
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      console.log(`[AUTH] [${now}] Verifying Firebase ID token...`);
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = { id: decodedToken.uid };
      console.log(`[AUTH] [${now}] Token verified. User ID: ${decodedToken.uid}`);
      next();
    } catch (error) {
      console.error(`[AUTH] [${now}] Firebase token verification error:`, error);
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error(`[AUTH] [${now}] Unexpected error in authentication middleware:`, error);
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};
