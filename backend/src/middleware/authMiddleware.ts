import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

import { IUser } from '../models/User';

// Define the JWT payload type
interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

// Define the user type that will be attached to the request
interface AuthenticatedUser {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  [key: string]: any;
}

// Extend the Express Request type to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

/**
 * Protect routes - ensures the request is authenticated
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  console.log('[AUTH] Protect middleware called');
  
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('[AUTH] No Authorization header found');
      return res.status(401).json({ 
        message: 'Not authenticated',
        details: 'No authentication token provided',
        code: 'MISSING_AUTH_HEADER'
      });
    }

    console.log('[AUTH] Authorization header found');
    
    // Verify Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      console.error('[AUTH] Invalid Authorization header format');
      return res.status(401).json({ 
        message: 'Not authenticated',
        details: 'Invalid Authorization header format. Expected: Bearer <token>',
        code: 'INVALID_AUTH_HEADER_FORMAT'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('[AUTH] No token provided after Bearer');
      return res.status(401).json({ 
        message: 'Not authenticated',
        details: 'No token provided after Bearer',
        code: 'MISSING_TOKEN'
      });
    }
    
    console.log('[AUTH] Token extracted, verifying...');
    
    // Verify token
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    if (!process.env.JWT_SECRET) {
      console.warn('[AUTH] WARNING: Using default JWT secret. This is not recommended for production!');
    }
    
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, secret) as JwtPayload;
      console.log('[AUTH] Token verified successfully. User ID:', decoded.id);
    } catch (error) {
      console.error('[AUTH] Token verification failed:', error);
      const errorMessage = error instanceof jwt.TokenExpiredError
        ? 'Token has expired'
        : error instanceof jwt.JsonWebTokenError
          ? 'Invalid token'
          : 'Token verification failed';
          
      return res.status(401).json({ 
        message: 'Not authenticated',
        details: errorMessage,
        code: 'INVALID_TOKEN',
        expired: error instanceof jwt.TokenExpiredError
      });
    }
    
    // Get user from database
    console.log('[AUTH] Fetching user from database...');
    try {
      // Explicitly type the user document from the database
      interface UserDocument {
        _id: any;
        name: string;
        email: string;
        isAdmin?: boolean;
        [key: string]: any;
      }
      
      const user = await User.findById(decoded.id).select('-password').lean<UserDocument>().exec();
      
      if (!user) {
        console.error('[AUTH] User not found in database');
        return res.status(401).json({ 
          message: 'Not authenticated',
          details: 'User account not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Create a clean user object with only the properties we need
      const userObj: AuthenticatedUser = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false
      };
      
      // Attach user to request
      req.user = userObj;
      
      console.log('[AUTH] User authenticated successfully:', { 
        userId: userObj._id,
        email: userObj.email,
        isAdmin: userObj.isAdmin || false
      });
      
      // Continue to the next middleware/route handler
      return next();
      
    } catch (dbError) {
      console.error('[AUTH] Database error during authentication:', dbError);
      return res.status(500).json({ 
        message: 'Authentication failed',
        details: 'Error accessing user data',
        code: 'AUTH_DATABASE_ERROR',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
    
  } catch (error) {
    console.error('[AUTH] Unexpected error in protect middleware:', error);
    return res.status(500).json({ 
      message: 'Authentication failed',
      details: 'An unexpected error occurred',
      code: 'AUTH_INTERNAL_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Admin middleware
export const admin = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[AUTH] Admin middleware checking user:', req.user?._id);
    
    if (!req.user) {
      console.error('[AUTH] Admin check failed: No user in request');
      return res.status(401).json({ 
        message: 'Not authenticated',
        details: 'No authentication token provided'
      });
    }
    
    if (!(req.user as any).isAdmin) {
      console.error(`[AUTH] Admin check failed: User ${req.user._id} is not an admin`);
      return res.status(403).json({ 
        message: 'Not authorized',
        details: 'Admin privileges required'
      });
    }
    
    console.log(`[AUTH] Admin access granted for user: ${req.user._id}`);
    next();
  } catch (error) {
    console.error('[AUTH] Admin middleware error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Generate JWT token
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '30d' }
  ) as string;
};
