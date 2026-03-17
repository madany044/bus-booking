import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { BookingRequest, Passenger } from '../types';

export async function createBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const client = await pool.connect();
  try {
    const { busId, seats, passengerDetails } = req.body as BookingRequest;

    // Validate
    if (!busId || !seats || !passengerDetails) {
      throw new AppError('busId, seats, and passengerDetails are required', 400);
    }
    if (!Array.isArray(seats) || seats.length === 0) {
      throw new AppError('seats must be a non-empty array', 400);
    }
    if (!Array.isArray(passengerDetails) || passengerDetails.length === 0) {
      throw new AppError('passengerDetails must be a non-empty array', 400);
    }
    if (seats.length !== passengerDetails.length) {
      throw new AppError('Number of seats must match number of passengers', 400);
    }

    // Validate passengers
    for (const p of passengerDetails) {
      if (!p.name || !p.age || !p.gender) {
        throw new AppError('Each passenger must have name, age, and gender', 400);
      }
      if (!['male', 'female', 'other'].includes(p.gender)) {
        throw new AppError('Gender must be male, female, or other', 400);
      }
      if (p.age < 1 || p.age > 120) {
        throw new AppError('Invalid age', 400);
      }
    }

    await client.query('BEGIN');

    // Get bus and verify it exists
    const busResult = await client.query(
      'SELECT id, price FROM buses WHERE id = $1',
      [busId]
    );
    if (busResult.rows.length === 0) {
      throw new AppError('Bus not found', 404);
    }
    const busPrice = busResult.rows[0].price;

    // Get seat IDs and verify availability
    const seatResult = await client.query(
      `SELECT s.id, s.seat_number,
        CASE 
          WHEN bs.seat_id IS NOT NULL THEN false
          WHEN sr.seat_id IS NOT NULL AND sr.expires_at > NOW() THEN false
          ELSE true
        END as is_available
       FROM seats s
       LEFT JOIN booked_seats bs ON bs.seat_id = s.id
       LEFT JOIN seat_reservations sr ON sr.seat_id = s.id AND sr.expires_at > NOW()
       WHERE s.bus_id = $1 AND s.seat_number = ANY($2::int[])`,
      [busId, seats]
    );

    if (seatResult.rows.length !== seats.length) {
      throw new AppError('One or more seat numbers are invalid', 400);
    }

    const unavailable = seatResult.rows.filter((s) => !s.is_available);
    if (unavailable.length > 0) {
      const nums = unavailable.map((s) => s.seat_number).join(', ');
      throw new AppError(`Seats ${nums} are not available`, 409);
    }

    const totalPrice = busPrice * seats.length;

    // Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (bus_id, total_price) VALUES ($1, $2) RETURNING id`,
      [busId, totalPrice]
    );
    const bookingId = bookingResult.rows[0].id;

    // Insert booked seats
    for (const seat of seatResult.rows) {
      await client.query(
        `INSERT INTO booked_seats (booking_id, seat_id, bus_id) VALUES ($1, $2, $3)`,
        [bookingId, seat.id, busId]
      );
      // Remove reservation if exists
      await client.query(
        `DELETE FROM seat_reservations WHERE seat_id = $1`,
        [seat.id]
      );
    }

    // Insert passengers
    for (const passenger of passengerDetails as Passenger[]) {
      await client.query(
        `INSERT INTO passengers (booking_id, name, age, gender) VALUES ($1, $2, $3, $4)`,
        [bookingId, passenger.name, passenger.age, passenger.gender]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Booking successful',
      id: bookingId,
      seatsBooked: seats,
      totalPrice,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function reserveSeats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const client = await pool.connect();
  try {
    const { busId, seats } = req.body as { busId: string; seats: number[] };

    if (!busId || !seats || !Array.isArray(seats) || seats.length === 0) {
      throw new AppError('busId and seats are required', 400);
    }

    await client.query('BEGIN');

    // Clean up expired reservations
    await client.query(`DELETE FROM seat_reservations WHERE expires_at <= NOW()`);

    const seatResult = await client.query(
      `SELECT s.id, s.seat_number,
        CASE 
          WHEN bs.seat_id IS NOT NULL THEN false
          WHEN sr.seat_id IS NOT NULL AND sr.expires_at > NOW() THEN false
          ELSE true
        END as is_available
       FROM seats s
       LEFT JOIN booked_seats bs ON bs.seat_id = s.id
       LEFT JOIN seat_reservations sr ON sr.seat_id = s.id AND sr.expires_at > NOW()
       WHERE s.bus_id = $1 AND s.seat_number = ANY($2::int[])`,
      [busId, seats]
    );

    const unavailable = seatResult.rows.filter((s) => !s.is_available);
    if (unavailable.length > 0) {
      throw new AppError(
        `Seats ${unavailable.map((s) => s.seat_number).join(', ')} are not available`,
        409
      );
    }

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    for (const seat of seatResult.rows) {
      await client.query(
        `INSERT INTO seat_reservations (seat_id, bus_id, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (seat_id, bus_id) DO UPDATE SET expires_at = $3, reserved_at = NOW()`,
        [seat.id, busId, expiresAt]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: 'Seats reserved for 2 minutes',
      expiresAt: expiresAt.toISOString(),
      reservedSeats: seats,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function getBookingById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { bookingId } = req.params;

    const bookingResult = await pool.query(
      `SELECT bk.id, bk.bus_id, bk.total_price, bk.created_at,
              b.name as bus_name, b.is_ac, b.price as seat_price
       FROM bookings bk
       JOIN buses b ON b.id = bk.bus_id
       WHERE bk.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    const booking = bookingResult.rows[0];

    const passengersResult = await pool.query(
      `SELECT name, age, gender FROM passengers WHERE booking_id = $1`,
      [bookingId]
    );

    const seatsResult = await pool.query(
      `SELECT s.seat_number FROM booked_seats bs
       JOIN seats s ON s.id = bs.seat_id
       WHERE bs.booking_id = $1`,
      [bookingId]
    );

    const stopsResult = await pool.query(
      `SELECT stop_name, arrival_time, departure_time FROM stops
       WHERE bus_id = $1 ORDER BY stop_order ASC`,
      [booking.bus_id]
    );

    res.json({
      id: booking.id,
      busId: booking.bus_id,
      busName: booking.bus_name,
      isAC: booking.is_ac,
      totalPrice: booking.total_price,
      createdAt: booking.created_at,
      seatsBooked: seatsResult.rows.map((s) => s.seat_number),
      passengers: passengersResult.rows,
      stops: stopsResult.rows.map((s) => ({
        stopName: s.stop_name,
        ...(s.arrival_time && { arrivalTime: s.arrival_time }),
        ...(s.departure_time && { departureTime: s.departure_time }),
      })),
    });
  } catch (err) {
    next(err);
  }
}
