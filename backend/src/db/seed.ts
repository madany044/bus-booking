import pool from './pool';
import { createTables } from './migrate';
import dotenv from 'dotenv';
dotenv.config();

const busesData = [
  {
    name: 'KSRTC Airavat',
    is_ac: true,
    price: 1000,
    stops: [
      { stop_name: 'Bangalore', departure_time: '09:00 AM', stop_order: 1 },
      { stop_name: 'Hosur', arrival_time: '10:00 AM', departure_time: '10:15 AM', stop_order: 2 },
      { stop_name: 'Vellore', arrival_time: '01:00 PM', departure_time: '01:15 PM', stop_order: 3 },
      { stop_name: 'Chennai', arrival_time: '03:00 PM', stop_order: 4 },
    ],
    seatType: 'normal' as const,
    totalSeats: 40,
  },
  {
    name: 'SRS Travels',
    is_ac: false,
    price: 600,
    stops: [
      { stop_name: 'Bangalore', departure_time: '12:00 PM', stop_order: 1 },
      { stop_name: 'Krishnagiri', arrival_time: '01:30 PM', departure_time: '01:45 PM', stop_order: 2 },
      { stop_name: 'Vellore', arrival_time: '04:00 PM', departure_time: '04:15 PM', stop_order: 3 },
      { stop_name: 'Chennai', arrival_time: '06:00 PM', stop_order: 4 },
    ],
    seatType: 'normal' as const,
    totalSeats: 40,
  },
  {
    name: 'VRL Travels Express',
    is_ac: true,
    price: 1200,
    stops: [
      { stop_name: 'Bangalore', departure_time: '08:00 AM', stop_order: 1 },
      { stop_name: 'Chennai', arrival_time: '02:00 PM', stop_order: 2 },
    ],
    seatType: 'semi-sleeper' as const,
    totalSeats: 36,
  },
  {
    name: 'Orange Travels',
    is_ac: true,
    price: 1500,
    stops: [
      { stop_name: 'Bangalore', departure_time: '10:00 PM', stop_order: 1 },
      { stop_name: 'Chennai', arrival_time: '06:00 AM', stop_order: 2 },
    ],
    seatType: 'sleeper' as const,
    totalSeats: 32,
  },
  {
    name: 'Chartered Bus',
    is_ac: false,
    price: 450,
    stops: [
      { stop_name: 'Bangalore', departure_time: '06:00 AM', stop_order: 1 },
      { stop_name: 'Hosur', arrival_time: '07:00 AM', departure_time: '07:10 AM', stop_order: 2 },
      { stop_name: 'Chennai', arrival_time: '12:00 PM', stop_order: 3 },
    ],
    seatType: 'normal' as const,
    totalSeats: 44,
  },
  {
    name: 'IntrCity SmartBus',
    is_ac: true,
    price: 999,
    stops: [
      { stop_name: 'Bangalore', departure_time: '02:00 PM', stop_order: 1 },
      { stop_name: 'Chennai', arrival_time: '08:00 PM', stop_order: 2 },
    ],
    seatType: 'semi-sleeper' as const,
    totalSeats: 36,
  },
  {
    name: 'Parveen Travels',
    is_ac: false,
    price: 750,
    stops: [
      { stop_name: 'Bangalore', departure_time: '09:30 PM', stop_order: 1 },
      { stop_name: 'Vellore', arrival_time: '01:30 AM', departure_time: '01:45 AM', stop_order: 2 },
      { stop_name: 'Chennai', arrival_time: '04:00 AM', stop_order: 3 },
    ],
    seatType: 'sleeper' as const,
    totalSeats: 32,
  },
  {
    name: 'KPN Travels',
    is_ac: true,
    price: 1800,
    stops: [
      { stop_name: 'Bangalore', departure_time: '08:30 PM', stop_order: 1 },
      { stop_name: 'Chennai', arrival_time: '04:30 AM', stop_order: 2 },
    ],
    seatType: 'sleeper' as const,
    totalSeats: 30,
  },
   {
    name: 'KPB Travels',
    is_ac: true,
    price: 1800,
    stops: [
      { stop_name: 'Mumbai', departure_time: '08:30 PM', stop_order: 1 },
      { stop_name: 'Bangalore', arrival_time: '04:30 AM', stop_order: 2 },
    ],
    seatType: 'sleeper' as const,
    totalSeats: 30,
  },
];

function generateSeats(totalSeats: number, seatType: 'normal' | 'semi-sleeper' | 'sleeper') {
  const seats = [];
  const cols = seatType === 'sleeper' ? 2 : 4; // sleeper: 2-aisle-2 simplified as 2 cols
  for (let i = 1; i <= totalSeats; i++) {
    const row = Math.ceil(i / cols);
    const col = ((i - 1) % cols) + 1;
    const seat: any = {
      seat_number: i,
      seat_type: seatType,
      row_num: row,
      col_num: col,
    };
    if (seatType === 'sleeper') {
      seat.sleeper_level = row % 2 === 0 ? 'upper' : 'lower';
    }
    seats.push(seat);
  }
  return seats;
}

async function seed() {
  console.log('🌱 Starting seed...');
  await createTables();

  const client = await pool.connect();
  try {
    // Clear existing data
    await client.query('DELETE FROM seat_reservations');
    await client.query('DELETE FROM passengers');
    await client.query('DELETE FROM booked_seats');
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM seats');
    await client.query('DELETE FROM stops');
    await client.query('DELETE FROM buses');

    for (const busData of busesData) {
      // Insert bus
      const busResult = await client.query(
        `INSERT INTO buses (name, is_ac, price) VALUES ($1, $2, $3) RETURNING id`,
        [busData.name, busData.is_ac, busData.price]
      );
      const busId = busResult.rows[0].id;

      // Insert stops
      for (const stop of busData.stops) {
        await client.query(
          `INSERT INTO stops (bus_id, stop_name, arrival_time, departure_time, stop_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [busId, stop.stop_name, (stop as any).arrival_time || null, stop.departure_time || null, stop.stop_order]
        );
      }

      // Insert seats
      const seats = generateSeats(busData.totalSeats, busData.seatType);
      for (const seat of seats) {
        await client.query(
          `INSERT INTO seats (bus_id, seat_number, seat_type, sleeper_level, row_num, col_num)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [busId, seat.seat_number, seat.seat_type, seat.sleeper_level || null, seat.row_num, seat.col_num]
        );
      }

      console.log(`✅ Seeded: ${busData.name} (${busId})`);
    }

    console.log('🎉 Seed complete!');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
