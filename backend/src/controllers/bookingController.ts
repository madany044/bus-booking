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
    const userId = (req as any).user?.id || null;

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

    const busResult = await client.query(
      'SELECT id, price FROM buses WHERE id = $1',
      [busId]
    );
    if (busResult.rows.length === 0) throw new AppError('Bus not found', 404);
    const busPrice = busResult.rows[0].price;

    // Only block on hard bookings — not reservations
    const hardBookedResult = await client.query(
      `SELECT s.seat_number FROM seats s
       JOIN booked_seats bs ON bs.seat_id = s.id
       WHERE s.bus_id = $1 AND s.seat_number = ANY($2::int[])`,
      [busId, seats]
    );
    if (hardBookedResult.rows.length > 0) {
      const nums = hardBookedResult.rows.map((s: any) => s.seat_number).join(', ');
      throw new AppError(`Seats ${nums} are already booked`, 409);
    }

    const seatResult = await client.query(
      `SELECT id, seat_number FROM seats WHERE bus_id = $1 AND seat_number = ANY($2::int[])`,
      [busId, seats]
    );
    if (seatResult.rows.length !== seats.length) {
      throw new AppError('One or more seat numbers are invalid', 400);
    }

    const totalPrice = busPrice * seats.length;

    const bookingResult = await client.query(
      `INSERT INTO bookings (bus_id, total_price, user_id) VALUES ($1, $2, $3) RETURNING id`,
      [busId, totalPrice, userId]
    );
    const bookingId = bookingResult.rows[0].id;

    for (const seat of seatResult.rows) {
      await client.query(
        `INSERT INTO booked_seats (booking_id, seat_id, bus_id) VALUES ($1, $2, $3)`,
        [bookingId, seat.id, busId]
      );
      await client.query(
        `DELETE FROM seat_reservations WHERE seat_id = $1`,
        [seat.id]
      );
    }

    for (const passenger of passengerDetails as Passenger[]) {
      await client.query(
        `INSERT INTO passengers (booking_id, name, age, gender) VALUES ($1, $2, $3, $4)`,
        [bookingId, passenger.name.trim(), passenger.age, passenger.gender]
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

    // Clean expired reservations
    await client.query(`DELETE FROM seat_reservations WHERE expires_at <= NOW()`);

    // Only block on hard bookings — allow overwriting reservations
    const hardBookedResult = await client.query(
      `SELECT s.seat_number FROM seats s
       JOIN booked_seats bs ON bs.seat_id = s.id
       WHERE s.bus_id = $1 AND s.seat_number = ANY($2::int[])`,
      [busId, seats]
    );
    if (hardBookedResult.rows.length > 0) {
      const nums = hardBookedResult.rows.map((s: any) => s.seat_number).join(', ');
      throw new AppError(`Seats ${nums} are already booked`, 409);
    }

    const seatResult = await client.query(
      `SELECT id, seat_number FROM seats WHERE bus_id = $1 AND seat_number = ANY($2::int[])`,
      [busId, seats]
    );
    if (seatResult.rows.length !== seats.length) {
      throw new AppError('One or more seat numbers are invalid', 400);
    }

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

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
              b.name as bus_name, b.is_ac
       FROM bookings bk
       JOIN buses b ON b.id = bk.bus_id
       WHERE bk.id = $1`,
      [bookingId]
    );
    if (bookingResult.rows.length === 0) throw new AppError('Booking not found', 404);

    const booking = bookingResult.rows[0];

    const [passengersResult, seatsResult, stopsResult] = await Promise.all([
      pool.query(`SELECT name, age, gender FROM passengers WHERE booking_id = $1`, [bookingId]),
      pool.query(
        `SELECT s.seat_number FROM booked_seats bs
         JOIN seats s ON s.id = bs.seat_id WHERE bs.booking_id = $1`,
        [bookingId]
      ),
      pool.query(
        `SELECT stop_name, arrival_time, departure_time FROM stops
         WHERE bus_id = $1 ORDER BY stop_order ASC`,
        [booking.bus_id]
      ),
    ]);

    res.json({
      id: booking.id,
      busId: booking.bus_id,
      busName: booking.bus_name,
      isAC: booking.is_ac,
      totalPrice: booking.total_price,
      createdAt: booking.created_at,
      seatsBooked: seatsResult.rows.map((s: any) => s.seat_number),
      passengers: passengersResult.rows,
      stops: stopsResult.rows.map((s: any) => ({
        stopName: s.stop_name,
        ...(s.arrival_time && { arrivalTime: s.arrival_time }),
        ...(s.departure_time && { departureTime: s.departure_time }),
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyBookings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    const result = await pool.query(
      `SELECT bk.id, bk.bus_id, bk.total_price, bk.created_at,
              b.name as bus_name, b.is_ac
       FROM bookings bk
       JOIN buses b ON b.id = bk.bus_id
       WHERE bk.user_id = $1
       ORDER BY bk.created_at DESC`,
      [userId]
    );

    const bookings = await Promise.all(
      result.rows.map(async (bk: any) => {
        const [seats, stops] = await Promise.all([
          pool.query(
            `SELECT s.seat_number FROM booked_seats bs
             JOIN seats s ON s.id = bs.seat_id WHERE bs.booking_id = $1`,
            [bk.id]
          ),
          pool.query(
            `SELECT stop_name, arrival_time, departure_time FROM stops
             WHERE bus_id = $1 ORDER BY stop_order ASC`,
            [bk.bus_id]
          ),
        ]);
        return {
          id: bk.id,
          busName: bk.bus_name,
          isAC: bk.is_ac,
          totalPrice: bk.total_price,
          createdAt: bk.created_at,
          seatsBooked: seats.rows.map((s: any) => s.seat_number),
          stops: stops.rows.map((s: any) => ({
            stopName: s.stop_name,
            ...(s.arrival_time && { arrivalTime: s.arrival_time }),
            ...(s.departure_time && { departureTime: s.departure_time }),
          })),
        };
      })
    );

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
}
