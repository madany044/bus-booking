import pool from './pool';

export async function createTables(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Buses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS buses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        is_ac BOOLEAN NOT NULL DEFAULT false,
        price INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Stops table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stops (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
        stop_name VARCHAR(255) NOT NULL,
        arrival_time VARCHAR(20),
        departure_time VARCHAR(20),
        stop_order INTEGER NOT NULL
      );
    `);

    // Seats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
        seat_number INTEGER NOT NULL,
        seat_type VARCHAR(20) NOT NULL CHECK (seat_type IN ('normal', 'semi-sleeper', 'sleeper')),
        sleeper_level VARCHAR(10) CHECK (sleeper_level IN ('upper', 'lower')),
        row_num INTEGER NOT NULL,
        col_num INTEGER NOT NULL,
        UNIQUE(bus_id, seat_number)
      );
    `);

    // Bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bus_id UUID NOT NULL REFERENCES buses(id),
        total_price INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Booked seats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS booked_seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        seat_id UUID NOT NULL REFERENCES seats(id),
        bus_id UUID NOT NULL REFERENCES buses(id),
        UNIQUE(seat_id, bus_id)
      );
    `);

    // Passengers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS passengers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        age INTEGER NOT NULL,
        gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other'))
      );
    `);

    // Seat reservations (2-min timer locks)
    await client.query(`
      CREATE TABLE IF NOT EXISTS seat_reservations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seat_id UUID NOT NULL REFERENCES seats(id),
        bus_id UUID NOT NULL REFERENCES buses(id),
        reserved_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        UNIQUE(seat_id, bus_id)
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Tables created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', err);
    throw err;
  } finally {
    client.release();
  }
}
