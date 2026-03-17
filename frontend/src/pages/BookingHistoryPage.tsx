import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { BookingDetail } from '../types';
import { formatPrice, getDepartureTime, getArrivalTime } from '../utils/helpers';
import './BookingHistoryPage.css';

export default function BookingHistoryPage() {
  const navigate = useNavigate();
  const [bookingId, setBookingId] = useState('');
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingId.trim()) return;
    setLoading(true);
    setError('');
    setBooking(null);
    try {
      const res = await api.get<BookingDetail>(`/bookings/${bookingId.trim()}`);
      setBooking(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking not found');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="history-page container page-enter">
      <h2 className="history-title">My Bookings</h2>
      <p className="history-sub">Enter your booking ID to look up a booking.</p>

      <form className="history-search card" onSubmit={handleSearch}>
        <div className="form-group history-form-group">
          <label className="form-label">Booking ID</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. b2587d1c-29f8-4b0f-a01c-1e2f9f5b7a61"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !bookingId.trim()}>
          {loading ? <><span className="spinner" /> Searching...</> : 'Search'}
        </button>
      </form>

      {error && (
        <div className="history-error">⚠️ {error}</div>
      )}

      {booking && (
        <div className="history-result card page-enter">
          <div className="result-header">
            <div>
              <h3 className="result-bus-name">{booking.busName}</h3>
              <p className="result-route">
                {booking.stops[0]?.stopName} → {booking.stops[booking.stops.length - 1]?.stopName}
              </p>
              <p className="result-time">
                🕐 {getDepartureTime(booking.stops)} – {getArrivalTime(booking.stops)}
              </p>
            </div>
            <div className="result-right">
              <span className="result-price">{formatPrice(booking.totalPrice)}</span>
              <span className="result-seats">{booking.seatsBooked.length} seat{booking.seatsBooked.length > 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="result-details">
            <div className="result-detail-row">
              <span className="detail-label">Booking ID</span>
              <span className="detail-mono">{booking.id}</span>
            </div>
            <div className="result-detail-row">
              <span className="detail-label">Seats</span>
              <span>{booking.seatsBooked.join(', ')}</span>
            </div>
            <div className="result-detail-row">
              <span className="detail-label">Booked On</span>
              <span>{new Date(booking.createdAt).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="result-passengers">
            <p className="passengers-heading">Passengers</p>
            {booking.passengers.map((p, i) => (
              <div key={i} className="result-passenger">
                <span className="pax-num">{i + 1}</span>
                <span className="pax-name">{p.name}</span>
                <span className="pax-info">{p.age} yrs · <span style={{ textTransform: 'capitalize' }}>{p.gender}</span></span>
                <span className="pax-seat badge badge-blue">Seat {booking.seatsBooked[i]}</span>
              </div>
            ))}
          </div>

          <button
            className="btn btn-outline view-full-btn"
            onClick={() => navigate(`/confirmation/${booking.id}`)}
          >
            View Full Details →
          </button>
        </div>
      )}

      {!booking && !error && !loading && (
        <div className="history-empty">
          <span>🎫</span>
          <p>No booking looked up yet. Enter a booking ID above.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Book a Bus</button>
        </div>
      )}
    </div>
  );
}
