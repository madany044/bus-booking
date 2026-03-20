import { Router } from 'express';
import { getBuses, getBusById } from '../controllers/busController';
import {
  createBooking,
  reserveSeats,
  getBookingById,
  getMyBookings,
} from '../controllers/bookingController';
import { register, login, logout, getMe } from '../controllers/authController';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', requireAuth, getMe);

// Bus routes (public)
router.get('/buses', getBuses);
router.get('/buses/:busId', getBusById);

// Booking routes
router.post('/reservations', reserveSeats);               // guest allowed
router.post('/bookings', optionalAuth, createBooking);    // guest allowed, but tracks user if logged in
router.get('/bookings/my', requireAuth, getMyBookings);   // must be logged in
router.get('/bookings/:bookingId', getBookingById);       // public lookup by ID

export default router;
