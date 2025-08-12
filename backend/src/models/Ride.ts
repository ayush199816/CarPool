import { Schema, model, Document, Types } from 'mongoose';

export interface IStoppage {
  name: string;
  order: number;
}

export interface IBookingRequest {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  seats: number;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRide extends Document {
  startPoint: string;
  endPoint: string;
  rideType: 'in-city' | 'intercity';
  stoppages: IStoppage[];
  travelDate: Date;
  availableSeats: number;
  pricePerSeat: number;
  driverId: Types.ObjectId;
  bookingRequests: IBookingRequest[];
  createdAt: Date;
  updatedAt: Date;
}

const stoppageSchema = new Schema<IStoppage>({
  name: {
    type: String,
    required: [true, 'Stoppage name is required'],
    trim: true,
  },
  order: {
    type: Number,
    required: [true, 'Stoppage order is required'],
    min: [1, 'Order must be at least 1'],
  },
});

const bookingRequestSchema = new Schema<IBookingRequest>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  seats: {
    type: Number,
    required: true,
    min: [1, 'At least one seat must be requested'],
  },
  message: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

const rideSchema = new Schema<IRide>(
  {
    startPoint: {
      type: String,
      required: [true, 'Start point is required'],
      trim: true,
    },
    endPoint: {
      type: String,
      required: [true, 'End point is required'],
      trim: true,
    },
    rideType: {
      type: String,
      required: [true, 'Ride type is required'],
      enum: {
        values: ['in-city', 'intercity'],
        message: 'Ride type must be either in-city or intercity',
      },
      default: 'in-city',
    },
    stoppages: [stoppageSchema],
    travelDate: {
      type: Date,
      required: [true, 'Travel date is required'],
      min: [new Date(), 'Travel date must be in the future'],
    },
    availableSeats: {
      type: Number,
      required: [true, 'Available seats is required'],
      min: [1, 'At least one seat must be available'],
    },
    pricePerSeat: {
      type: Number,
      required: [true, 'Price per seat is required'],
      min: [0, 'Price cannot be negative'],
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: [true, 'Driver ID is required'],
    },
    bookingRequests: [bookingRequestSchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        // Create a new object to avoid mutating the original
        const transformed = { ...ret };
        // Use bracket notation and type assertion to avoid TypeScript errors
        transformed.id = transformed._id;
        delete (transformed as any)._id;
        if ('__v' in transformed) {
          delete (transformed as any).__v;
        }
        return transformed;
      },
    },
  }
);

// Index for faster queries on common search fields
rideSchema.index({ startPoint: 'text', endPoint: 'text' });
rideSchema.index({ travelDate: 1 });

export default model<IRide>('Ride', rideSchema);
