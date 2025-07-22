import mongoose from 'mongoose';

// Use a default connection string if not provided in environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expo-mongoose-ts';

const connectDB = async (): Promise<void> => {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    
    // Log connection string with sensitive info redacted
    const redactedUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`🔗 Connection string: ${redactedUri}`);
    
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    const conn = await mongoose.connect(MONGODB_URI, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    console.log(`🔄 Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error(error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure MongoDB is running (try `mongod` in a new terminal)');
    console.log('2. Check if the connection string is correct');
    console.log('3. Verify your firewall allows connections to MongoDB (port 27017)');
    console.log('4. Try connecting using MongoDB Compass or mongo shell');
    console.log('\n💡 Using connection string:', MONGODB_URI);
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established successfully');});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('ℹ️  MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('ℹ️  MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;
