export interface Stoppage {
  name: string;
  order: number;
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

export interface Ride {
  _id?: string;       // MongoDB-style ID (optional)
  id?: string;        // Standard ID (optional)
  startPoint: string;
  endPoint: string;
  stoppages: Stoppage[];
  travelDate: string;
  availableSeats: number;
  pricePerSeat: number;
  driverId: string;
  driver?: User;      // Populated driver information
  bookingRequests?: BookingRequest[]; // Booking requests for this ride
  createdAt: string;
  updatedAt: string;
}

export interface CreateRideInput {
  startPoint: string;
  endPoint: string;
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
