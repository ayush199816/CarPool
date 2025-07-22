import { connect, connection } from 'mongoose';
import { config } from 'dotenv';
import { MongoClient, Db } from 'mongodb';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carpool';

async function runMigration() {
  let client: MongoClient | null = null;
  
  try {
    console.log('Starting migration: Adding driverId to rides collection...');
    
    // Connect to MongoDB
    await connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the database instance
    if (!connection.db) {
      throw new Error('Database connection not established');
    }
    const db = connection.db as Db;
    
    const ridesCollection = db.collection('rides');
    
    // Check if the driverId field already exists
    const indexes = await ridesCollection.indexes();
    const hasDriverIdIndex = indexes.some(index => 
      index.key && 'driverId' in index.key
    );
    
    if (hasDriverIdIndex) {
      console.log('driverId field already exists in the rides collection');
      return;
    }
    
    // Add driverId field to all existing rides (setting to null for existing rides)
    console.log('Adding driverId field to rides collection...');
    await ridesCollection.updateMany(
      { driverId: { $exists: false } },
      { $set: { driverId: null } }
    );
    
    // Create an index on the driverId field
    console.log('Creating index on driverId field...');
    await ridesCollection.createIndex({ driverId: 1 });
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the connection
    if (connection) {
      await connection.close();
      console.log('MongoDB connection closed');
    }
    process.exit(0);
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Migration failed with error:', error);
  process.exit(1);
});
