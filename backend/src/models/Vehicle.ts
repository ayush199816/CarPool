import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  userId: mongoose.Types.ObjectId;
  make: string;
  modelName: string; // Changed from 'model' to avoid conflict with mongoose.Document
  year: number;
  color: string;
  licensePlate: string;
  registrationNumber: string;
  registrationExpiry: Date;
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceExpiry?: Date;
  vehicleType: 'car' | 'bike' | 'scooter' | 'other';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDocuments: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    make: {
      type: String,
      required: [true, 'Make is required'],
      trim: true,
    },
    modelName: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1900, 'Year must be after 1900'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
    },
    licensePlate: {
      type: String,
      required: [true, 'License plate is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
    },
    registrationExpiry: {
      type: Date,
      required: [true, 'Registration expiry date is required'],
    },
    insuranceProvider: {
      type: String,
      trim: true,
    },
    insuranceNumber: {
      type: String,
      trim: true,
    },
    insuranceExpiry: {
      type: Date,
    },
    vehicleType: {
      type: String,
      enum: ['car', 'bike', 'scooter', 'other'],
      default: 'car',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verificationDocuments: [{
      type: String,
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
VehicleSchema.index({ userId: 1, isActive: 1 });
VehicleSchema.index({ licensePlate: 1 }, { unique: true });
VehicleSchema.index({ registrationNumber: 1 }, { unique: true });

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);
