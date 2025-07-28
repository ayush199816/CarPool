export interface VerificationStatus {
  isVerified: boolean;
  documents?: {
    drivingLicense?: string;
    aadhaarCard?: string;
    verifiedAt?: Date | string;
  };
  vehicles?: Array<{
    id: string;
    type: 'Car' | 'Bike' | 'Scooty';
    number: string;
    company: string;
    model: string;
    color: string;
    rcDocument?: string;
    verified: boolean;
  }>;
  lastUpdated?: Date | string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin?: boolean;
  verification?: VerificationStatus;
  aadharNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ user: User; token: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  updateVerification: (verificationData: VerificationStatus) => Promise<void>;
  clearError: () => void;
  isUserVerified: () => boolean;
  getVerifiedVehicles: () => Array<VerificationStatus['vehicles']>[0] | [];
}
