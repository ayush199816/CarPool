import { Request, Response } from 'express';
import { Document } from 'mongoose';
import User, { IUser } from '../models/User';
import { generateToken } from '../middleware/authMiddleware';

// Note: We're now using the generateToken function from authMiddleware

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    if (user) {
      const userObj = user.toObject() as IUser & { _id: string };
      res.status(201).json({
        _id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        phone: userObj.phone,
        token: generateToken(userObj._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');
    
    if (user && (await user.comparePassword(password))) {
      const userObj = user.toObject() as IUser & { _id: string };
      res.json({
        _id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        isAdmin: userObj.isAdmin,
        token: generateToken(userObj._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
// @desc    Create admin user (one-time setup)
// @route   POST /api/auth/create-admin
// @access  Public
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@CarPool.com' });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@CarPool.com',
      password: 'Divyush@1629',
      phone: '+1234567890',
      isAdmin: true
    });

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      isAdmin: admin.isAdmin
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error during admin creation' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).user.id);
    
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
