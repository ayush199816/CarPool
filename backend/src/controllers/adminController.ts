import { Request, Response } from 'express';
import { Document } from 'mongoose';
import User, { IUser } from '../models/User';

// Use the global Request type which is already extended in authMiddleware
type AuthenticatedRequest = Request;

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').lean();
    res.status(200).json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user
// @route   PATCH /api/admin/users/:id
// @access  Private/Admin
// Extended user type with verification status
type UserWithVerification = IUser & {
  isVerified?: boolean;
  save(): Promise<Document & IUser>;
};

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, isAdmin, isVerified } = req.body;
    const user = await User.findById(req.params.id).exec() as (IUser & { isVerified?: boolean, save: () => Promise<Document & IUser> }) | null;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    
    if (typeof isAdmin === 'boolean') {
      user.isAdmin = isAdmin;
    }
    
    if (typeof isVerified === 'boolean') {
      user.isVerified = isVerified;
    }

    const savedUser = await user.save();
    const updatedUser = await User.findById(savedUser._id).select('-password').lean();
    res.json({
      ...updatedUser,
      isVerified: user.isVerified
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).exec();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting self
    if (req.user && req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get admin stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ isActive: true });
    const pendingVerifications = 0; // Will be implemented with verification system
    const totalRides = 0; // Will be implemented with ride system

    res.json({
      totalUsers,
      activeUsers,
      pendingVerifications,
      totalRides
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
