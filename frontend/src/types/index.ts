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
  age: number | '';
  gender: Gender | '';
}

export interface BookingResponse {
  message: string;
  id: string;
  seatsBooked: number[];
  totalPrice: number;
}

export interface BookingDetail {
  id: string;
  busId: string;
  busName: string;
  isAC: boolean;
  totalPrice: number;
  createdAt: string;
  seatsBooked: number[];
  passengers: { name: string; age: number; gender: string }[];
  stops: Stop[];
}

export interface SearchParams {
  departureCity: string;
  arrivalCity: string;
  date: string;
}

export interface BusFilters {
  seatType?: SeatType;
  isAC?: boolean;
  departureSlot?: DepartureSlot;
}

export interface PaginatedBusesResponse {
  page: number;
  pageSize: number;
  totalPages: number;
  totalBuses: number;
  buses: Bus[];
}
