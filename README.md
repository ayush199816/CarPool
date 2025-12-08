# Expo with TypeScript and MongoDB (Mongoose)

This is a starter project that combines Expo (React Native) with a TypeScript backend using Express and MongoDB with Mongoose.

## Project Structure

```
expo-mongoose-ts/
├── backend/               # Backend server code
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   └── app.ts        # Express server
│   ├── package.json
│   └── tsconfig.json
├── assets/               # Expo assets
├── App.tsx              # Main Expo app
└── package.json         # Frontend dependencies
```

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB (local or cloud instance)
- Expo CLI (for mobile development)

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with your MongoDB URI:
   ```
   MONGODB_URI=mongodb+srv://ayush199816_db_user:QBWUzI4DNPYKfbau@cluster0.4nnnwao.mongodb.net/carpool
   PORT=5001
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. In the project root, install Expo CLI (if not already installed):
   ```bash
   npm install -g expo-cli
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

## Available Scripts

### Backend
- `npm run dev`: Start the development server with hot-reload
- `npm run build`: Build the TypeScript code
- `npm start`: Start the production server

### Frontend
- `npm expo start`: Start the Expo development server
- `npm test`: Run tests
- `npm run web`: Run the web version

## Connecting to MongoDB

## Network Configuration

### Backend Configuration
The backend server runs on `http://192.168.31.175:5001` by default. You can access the API at:
- Local: `http://localhost:5001`
- Network: `http://192.168.31.175:5001`

### Frontend Configuration
Update the API URL in [src/Config.ts](cci:7://file:///d:/Projects/CarPool/src/Config.ts:0:0-0:0) to match your network configuration:
```typescript
// For development on physical devices
export const API_URL = '[http://192.168.31.175](http://192.168.31.175):5001/api';

// For Android emulator
// export const API_URL = '[http://10.0.2.2](http://10.0.2.2):5001/api';

// For iOS simulator
// export const API_URL = 'http://localhost:5001/api';

The application is configured to connect to MongoDB using Mongoose. Update the `MONGODB_URI` in the `.env` file to point to your MongoDB instance.

## API Endpoints

- `GET /` - Welcome message
- More endpoints will be added as you develop your application

## License

MIT
=======
# CarPool

