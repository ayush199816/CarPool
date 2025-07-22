const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expo-mongoose-ts';

console.log('Testing MongoDB connection...');
console.log('Connection string:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB!');
  console.log('Database name:', mongoose.connection.name);
  process.exit(0);
})
.catch(error => {
  console.error('❌ MongoDB connection error:');
  console.error(error);
  console.log('\nTroubleshooting steps:');
  console.log('1. Make sure MongoDB is running');
  console.log('2. Check if the connection string is correct');
  console.log('3. Try connecting using MongoDB Compass or mongo shell');
  process.exit(1);
});
