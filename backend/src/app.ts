import express, { Application, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
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
import os from 'os';
import { networkInterfaces } from 'os';

type NetworkInterfaceInfo = {
  address: string;
  netmask: string;
  family: string;
  mac: string;
  internal: boolean;
  cidr: string | null;
};

type NetworkInterfaces = {
  [key: string]: NetworkInterfaceInfo[] | undefined;
};

// Load environment variables from .env file in the backend directory
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading environment variables from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
}

// Verify environment variables
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '*** (set)' : '❌ not set');
console.log('PORT:', process.env.PORT || '5000 (default)');

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
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};
app.use(requestLogger);

// Health check endpoint (public)
const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'CarPool API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
};
app.get('/health', healthCheck);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

// Public health check endpoint
const apiHealthCheck = (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'CarPool API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected',
    uptime: process.uptime()
  });
};
app.get('/api/health', apiHealthCheck);

// API Routes (these are protected by auth middleware)
app.use('/api/rides', rideRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', bookingRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
const rootHandler = (req: Request, res: Response) => {
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
};
app.get('/', rootHandler);

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
};
app.use(errorHandler);

// Connect to MongoDB
connectDB();

// Start the server
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  const address = server.address();
  const host = typeof address === 'string' ? address : address?.address;
  const port = typeof address === 'string' ? PORT : address?.port;
  
  console.log(`Server is running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  
  // Get network interfaces
  try {
    const nets: NetworkInterfaces = networkInterfaces();
    const networkInfo = Object.entries(nets)
      .flatMap(([name, iface]) => 
        (iface || [])
          .filter((details: NetworkInterfaceInfo) => details.family === 'IPv4' && !details.internal)
          .map((details: NetworkInterfaceInfo) => `${name}: ${details.address}`)
      )
      .join('\n');
    
    console.log('Network interfaces available:');
    console.log(networkInfo || 'No network interfaces found');
    
    // Get the first non-internal IPv4 address
    const firstAddress = Object.values(nets)
      .flat()
      .filter((details): details is NetworkInterfaceInfo => details !== undefined)
      .find(details => details.family === 'IPv4' && !details.internal)?.address;
    
    if (firstAddress) {
      console.log(`Try accessing the API at: http://${firstAddress}:${PORT}`);
    }
  } catch (error) {
    console.log('Could not determine network interfaces');
  }
});

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log('✅ MongoDB connection established successfully');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
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
