export type SeatType = 'normal' | 'semi-sleeper' | 'sleeper';
export type SleeperLevel = 'upper' | 'lower';
export type Gender = 'male' | 'female' | 'other';
export type DepartureSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface Stop {
  stopName: string;
  arrivalTime?: string;
  departureTime?: string;
}

export interface Bus {
  id: string;
  name: string;
  stops: Stop[];
  availableSeats: number;
  price: number;
  seatTypes: SeatType[];
  isAC: boolean;
}

export interface Seat {
  seatNumber: number;
  isAvailable: boolean;
  row: number;
  column: number;
  seatType: SeatType;
  sleeperLevel?: SleeperLevel;
}

export interface BusWithSeats extends Bus {
  seats: Seat[];
}

export interface Passenger {
  name: string;
  age: number;
  gender: Gender;
}

export interface BookingRequest {
  busId: string;
  seats: number[];
  passengerDetails: Passenger[];
}

export interface BookingResponse {
  message: string;
  id: string;
  seatsBooked: number[];
  totalPrice: number;
}

export interface BusesQueryParams {
  departureCity: string;
  arrivalCity: string;
  date: string;
  seatType?: SeatType;
  isAC?: boolean;
  departureSlot?: DepartureSlot;
  page?: number;
  pageSize?: number;
}

export interface PaginatedBusesResponse {
  page: number;
  pageSize: number;
  totalPages: number;
  totalBuses: number;
  buses: Bus[];
}
