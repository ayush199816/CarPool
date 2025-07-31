import mongoose, { Connection } from 'mongoose';
import dotenv from 'dotenv';
import User, { IUser } from '../models/User';

dotenv.config();

const listUsers = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/expo-mongoose-ts';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully\n');

    // Get database connection with null check
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection not established');
    }
    
    // Get database name
    const dbName = db.databaseName;
    console.log(`Connected to database: ${dbName}`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in the database:');
    console.log(collections.map(c => c.name).join(', '));
    
    // Find all users
    console.log('\nQuerying users collection...');
    const users = await User.find({}).select('-password').lean(); // Exclude password hashes and convert to plain objects
    
    if (users.length === 0) {
      console.log('\nNo users found in the database.');
    } else {
      console.log(`\nFound ${users.length} user(s) in the database:`);
      console.log(users.map(user => {
        const userObj = user as IUser & { 
          createdAt?: Date; 
          updatedAt?: Date;
        };
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          createdAt: userObj.createdAt?.toISOString() || 'N/A',
          updatedAt: userObj.updatedAt?.toISOString() || 'N/A'
        };
      }));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error listing users:');
    console.error(error);
    process.exit(1);
  }
};

listUsers();
