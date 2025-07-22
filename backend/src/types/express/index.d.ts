import { Document } from 'mongoose';

// Define the base user interface
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  [key: string]: any;
}

declare global {
  namespace Express {
    // Extend the Express User type to include Mongoose document methods
    interface User extends IUser {
      _id: any; // Allow Mongoose's _id type
    }

    interface Request {
      user?: User;
    }
  }
}

// This is needed to make this file a module
export {};
