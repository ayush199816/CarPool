export interface Stoppage {
  name: string;
  order: number;
  rate?: number; // Optional rate for the stoppage
}

export interface User {
  id: string;
  _id?: string;  // MongoDB-style ID
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface BookingRequest {
  id: string;
  userId: string;
  user?: User;  // Made optional as passenger might be used instead
  passenger?: User; // Alias for user, for better semantics in the UI
  status: 'pending' | 'accepted' | 'rejected';
  seats: number;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type RideType = 'intercity' | 'in-city';

export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationNumber: string;
  userId: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ride {
  _id?: string;       // MongoDB-style ID (optional)
  id?: string;        // Standard ID (optional)
  startPoint: string;
  endPoint: string;
  startPointCoords?: Coordinates;
  endPointCoords?: Coordinates;
  rideType: RideType;  // 'intercity' or 'in-city'
  vehicleId: string;   // ID of the vehicle for this ride
  vehicle?: Vehicle;   // Populated vehicle information
  stoppages: Stoppage[];
  travelDate: string;
  availableSeats: number;
  pricePerSeat: number;
  driverId: string;
  driver?: User;      // Populated driver information
  bookingRequests?: BookingRequest[]; // Booking requests for this ride
  status?: 'pending' | 'accepted' | 'rejected'; // Status of the ride booking
  createdAt: string;
  updatedAt: string;
}

export interface CreateRideInput {
  startPoint: string;
  endPoint: string;
  startPointCoords?: Coordinates;
  endPointCoords?: Coordinates;
  rideType: RideType;  // 'intercity' or 'in-city'
  stoppages: Omit<Stoppage, 'order'>[];
  travelDate: string;
  availableSeats: number | string;
  pricePerSeat: number | string;
  driverId?: string; // Optional driver ID to associate with the ride
}

export interface UpdateRideInput extends Partial<CreateRideInput> {
  id: string;
}

export interface RideFilterParams {
  startPoint?: string;
  endPoint?: string;
  date?: string;
  minSeats?: number | string;
  maxPrice?: number | string;
}
