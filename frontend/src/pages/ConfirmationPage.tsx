import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { BookingDetail } from '../types';
import { formatPrice, getDepartureTime, getArrivalTime } from '../utils/helpers';
import './ConfirmationPage.css';

export default function ConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) return;
    api.get<BookingDetail>(`/bookings/${bookingId}`)
      .then((res) => setBooking(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Booking not found'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="confirm-loading">
        <div className="spinner spinner-dark" />
        <span>Loading your booking...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container">
        <div className="confirm-error card">
          <p>⚠️ {error || 'Booking not found'}</p>
          <button className="btn btn-outline" onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  const depTime = getDepartureTime(booking.stops);
  const arrTime = getArrivalTime(booking.stops);

  return (
    <div className="confirm-page container page-enter">
      <div className="confirm-banner">
        <div className="confirm-check">✓</div>
        <div>
          <h2 className="confirm-title">Booking Confirmed!</h2>
          <p className="confirm-sub">Your seats have been successfully booked.</p>
        </div>
      </div>

      <div className="confirm-layout">
        <div className="confirm-main">
          <div className="card confirm-card">
            <div className="confirm-card-header">
              <h3>Booking Details</h3>
              <span className="booking-id">ID: {booking.id.slice(0, 8).toUpperCase()}</span>
            </div>

            <div className="confirm-detail-grid">
              <div className="detail-block">
                <p className="detail-label">Bus</p>
                <p className="detail-value">{booking.busName}</p>
                <p className="detail-sub">{booking.isAC ? 'AC' : 'Non-AC'}</p>
              </div>
              <div className="detail-block">
                <p className="detail-label">Route</p>
                <p className="detail-value">
                  {booking.stops[0]?.stopName} → {booking.stops[booking.stops.length - 1]?.stopName}
                </p>
                <p className="detail-sub">🕐 {depTime} – {arrTime}</p>
              </div>
              <div className="detail-block">
                <p className="detail-label">Seats</p>
                <p className="detail-value">{booking.seatsBooked.join(', ')}</p>
                <p className="detail-sub">{booking.seatsBooked.length} seat{booking.seatsBooked.length > 1 ? 's' : ''}</p>
              </div>
              <div className="detail-block">
                <p className="detail-label">Total Paid</p>
                <p className="detail-value total-paid">{formatPrice(booking.totalPrice)}</p>
              </div>
            </div>
          </div>

          <div className="card confirm-card">
            <h3 className="confirm-card-section-title">Passenger Details</h3>
            <div className="passengers-list">
              {booking.passengers.map((p, i) => (
                <div key={i} className="passenger-row">
                  <span className="passenger-num">{i + 1}</span>
                  <div>
                    <p className="passenger-name">{p.name}</p>
                    <p className="passenger-info">{p.age} yrs · {p.gender}</p>
                  </div>
                  <span className="passenger-seat">Seat {booking.seatsBooked[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="confirm-actions">
          <button className="btn btn-primary full-btn" onClick={() => navigate('/')}>
            Book Another Bus
          </button>
          <button className="btn btn-outline full-btn" onClick={() => navigate('/bookings')}>
            View All Bookings
          </button>
        </div>
      </div>
    </div>
  );
}
