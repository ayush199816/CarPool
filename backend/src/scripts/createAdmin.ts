import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/expo-mongoose-ts';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@CarPool.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Divyush@1629', salt);

    const admin = new User({
      name: 'Admin',
      email: 'admin@CarPool.com',
      password: hashedPassword,
      phone: '+1234567890',
      aadharNumber: '999999999999', // Dummy Aadhar number
      isAdmin: true,
    });

    await admin.save();
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:');
    console.error(error);
    process.exit(1);
  }
};

createAdmin();
