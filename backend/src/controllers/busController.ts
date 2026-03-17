import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import {
  BusesQueryParams,
  SeatType,
  DepartureSlot,
  Bus,
  Stop,
} from '../types';

function parseTime12to24(timeStr: string): number {
  // Converts "09:00 AM" to hour number (9), "10:00 PM" to 22, etc.
  const [time, meridiem] = timeStr.split(' ');
  let [hours] = time.split(':').map(Number);
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours;
}

function getSlotForTime(timeStr: string): DepartureSlot {
  const hour = parseTime12to24(timeStr);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 20) return 'evening';
  return 'night';
}

export async function getBuses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      departureCity,
      arrivalCity,
      date,
      seatType,
      isAC,
      departureSlot,
      page = '1',
      pageSize = '10',
    } = req.query as Record<string, string>;

    // Validate required params
    if (!departureCity || !arrivalCity || !date) {
      throw new AppError('departureCity, arrivalCity, and date are required', 400);
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSizeNum = Math.min(50, Math.max(1, parseInt(pageSize)));

    // Build query: find buses that have stops matching both cities in order
    let query = `
      SELECT DISTINCT b.id, b.name, b.is_ac, b.price,
        dep_stop.departure_time as dep_time,
        arr_stop.arrival_time as arr_time
      FROM buses b
      JOIN stops dep_stop ON dep_stop.bus_id = b.id 
        AND LOWER(dep_stop.stop_name) = LOWER($1)
        AND dep_stop.departure_time IS NOT NULL
      JOIN stops arr_stop ON arr_stop.bus_id = b.id 
        AND LOWER(arr_stop.stop_name) = LOWER($2)
        AND arr_stop.stop_order > dep_stop.stop_order
      WHERE 1=1
    `;

    const params: (string | boolean)[] = [departureCity, arrivalCity];
    let paramIdx = 3;

    if (seatType) {
      query += ` AND EXISTS (
        SELECT 1 FROM seats s WHERE s.bus_id = b.id AND s.seat_type = $${paramIdx}
      )`;
      params.push(seatType as SeatType);
      paramIdx++;
    }

    if (isAC !== undefined) {
      const isACBool = isAC === 'true';
      query += ` AND b.is_ac = $${paramIdx}`;
      params.push(isACBool);
      paramIdx++;
    }

    const result = await pool.query(query, params);

    // Filter by departure slot (in memory since time parsing is needed)
    let buses = result.rows;
    if (departureSlot) {
      buses = buses.filter((bus) => {
        if (!bus.dep_time) return false;
        return getSlotForTime(bus.dep_time) === departureSlot.toLowerCase();
      });
    }

    const totalBuses = buses.length;
    const totalPages = Math.ceil(totalBuses / pageSizeNum);
    const offset = (pageNum - 1) * pageSizeNum;
    const paginatedBuses = buses.slice(offset, offset + pageSizeNum);

    // Enrich each bus with stops and seat info
    const enrichedBuses: Bus[] = await Promise.all(
      paginatedBuses.map(async (bus) => {
        const stopsResult = await pool.query(
          `SELECT stop_name, arrival_time, departure_time FROM stops 
           WHERE bus_id = $1 ORDER BY stop_order ASC`,
          [bus.id]
        );

        const seatsResult = await pool.query(
          `SELECT DISTINCT s.seat_type,
            COUNT(s.id) as total,
            COUNT(s.id) FILTER (
              WHERE NOT EXISTS (
                SELECT 1 FROM booked_seats bs WHERE bs.seat_id = s.id
              ) AND NOT EXISTS (
                SELECT 1 FROM seat_reservations sr 
                WHERE sr.seat_id = s.id AND sr.expires_at > NOW()
              )
            ) as available
           FROM seats s WHERE s.bus_id = $1 GROUP BY s.seat_type`,
          [bus.id]
        );

        const stops: Stop[] = stopsResult.rows.map((s) => ({
          stopName: s.stop_name,
          ...(s.arrival_time && { arrivalTime: s.arrival_time }),
          ...(s.departure_time && { departureTime: s.departure_time }),
        }));

        const availableSeats = seatsResult.rows.reduce(
          (sum: number, row: any) => sum + parseInt(row.available),
          0
        );
        const seatTypes = seatsResult.rows.map((r: any) => r.seat_type as SeatType);

        return {
          id: bus.id,
          name: bus.name,
          stops,
          availableSeats,
          price: bus.price,
          seatTypes,
          isAC: bus.is_ac,
        };
      })
    );

    res.json({
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
      totalBuses,
      buses: enrichedBuses,
    });
  } catch (err) {
    next(err);
  }
}

export async function getBusById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { busId } = req.params;

    const busResult = await pool.query(
      `SELECT id, name, is_ac, price FROM buses WHERE id = $1`,
      [busId]
    );

    if (busResult.rows.length === 0) {
      throw new AppError('Bus not found', 404);
    }

    const bus = busResult.rows[0];

    const stopsResult = await pool.query(
      `SELECT stop_name, arrival_time, departure_time FROM stops 
       WHERE bus_id = $1 ORDER BY stop_order ASC`,
      [busId]
    );

    const seatsResult = await pool.query(
      `SELECT s.id as seat_db_id, s.seat_number, s.seat_type, s.sleeper_level, s.row_num, s.col_num,
        CASE 
          WHEN bs.seat_id IS NOT NULL THEN false
          WHEN sr.seat_id IS NOT NULL AND sr.expires_at > NOW() THEN false
          ELSE true
        END as is_available
       FROM seats s
       LEFT JOIN booked_seats bs ON bs.seat_id = s.id
       LEFT JOIN seat_reservations sr ON sr.seat_id = s.id AND sr.expires_at > NOW()
       WHERE s.bus_id = $1
       ORDER BY s.seat_number ASC`,
      [busId]
    );

    const stops: Stop[] = stopsResult.rows.map((s) => ({
      stopName: s.stop_name,
      ...(s.arrival_time && { arrivalTime: s.arrival_time }),
      ...(s.departure_time && { departureTime: s.departure_time }),
    }));

    const seats = seatsResult.rows.map((s: any) => ({
      seatNumber: s.seat_number,
      isAvailable: s.is_available,
      row: s.row_num,
      column: s.col_num,
      seatType: s.seat_type,
      ...(s.sleeper_level && { sleeperLevel: s.sleeper_level }),
    }));

    const availableSeats = seats.filter((s) => s.isAvailable).length;
    const seatTypes = [...new Set(seats.map((s) => s.seatType))] as SeatType[];

    res.json({
      id: bus.id,
      name: bus.name,
      availableSeats,
      price: bus.price,
      seatTypes,
      isAC: bus.is_ac,
      stops,
      seats,
    });
  } catch (err) {
    next(err);
  }
}
