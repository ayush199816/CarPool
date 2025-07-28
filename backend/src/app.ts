import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import connectDB from './config/db';
import rideRoutes from './routes/rideRoutes';
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';
import verificationRoutes from './routes/verificationRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import adminRoutes from './routes/adminRoutes';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Fallback to default values if .env loading fails
if (!process.env.MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI not found in .env, using default');
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/expo-mongoose-ts';
}

if (!process.env.PORT) {
  console.warn('⚠️  PORT not found in .env, using default 5000');
  process.env.PORT = '5000';
}

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not found in .env, using default (not recommended for production)');
  process.env.JWT_SECRET = 'your_jwt_secret';
}

const app: Application = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - More permissive for development
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Handle preflight requests
app.options('*', cors());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

// API Routes
// API Routes
app.use('/api/rides', rideRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', bookingRoutes);
app.use('/api', verificationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: '🚗 Ride Sharing API',
    version: '1.0.0',
    endpoints: {
      rides: {
        GET: '/api/rides',
        POST: '/api/rides',
        'GET :id': '/api/rides/:id',
        PUT: '/api/rides/:id',
        DELETE: '/api/rides/:id',
      },
      health: '/health',
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Connect to MongoDB
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err);
  server.close(() => {
    process.exit(1);
  });
});

export default app;
