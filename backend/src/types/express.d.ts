import { IUser } from '../models/User';

// Define a common user type that matches what we expect in the request
export type AuthenticatedUser = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  isAdmin?: boolean;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
