import { Router } from 'express';
import { getBuses, getBusById } from '../controllers/busController';
import { createBooking, reserveSeats, getBookingById } from '../controllers/bookingController';

const router = Router();

// Bus routes
router.get('/buses', getBuses);
router.get('/buses/:busId', getBusById);

// Booking routes
router.post('/bookings', createBooking);
router.post('/reservations', reserveSeats);
router.get('/bookings/:bookingId', getBookingById);

export default router;
