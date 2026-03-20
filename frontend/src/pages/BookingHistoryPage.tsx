import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BookingDetail } from '../types';
import { formatPrice, getDepartureTime, getArrivalTime } from '../utils/helpers';
import './BookingHistoryPage.css';

interface MyBooking {
  id: string;
  busName: string;
  isAC: boolean;
  totalPrice: number;
  createdAt: string;
  seatsBooked: number[];
  stops: { stopName: string; arrivalTime?: string; departureTime?: string }[];
}

export default function BookingHistoryPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Logged-in user bookings
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState('');

  // Guest lookup
  const [bookingId, setBookingId] = useState('');
  const [lookedUpBooking, setLookedUpBooking] = useState<BookingDetail | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Fetch all bookings for logged-in user
  useEffect(() => {
    if (!user) return;
    setLoadingBookings(true);
    setBookingsError('');
    api.get<{ bookings: MyBooking[] }>('/bookings/my')
      .then((res) => setMyBookings(res.data.bookings))
      .catch((err: unknown) => setBookingsError(err instanceof Error ? err.message : 'Failed to load bookings'))
      .finally(() => setLoadingBookings(false));
  }, [user]);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingId.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    setLookedUpBooking(null);
    try {
      const res = await api.get<BookingDetail>(`/bookings/${bookingId.trim()}`);
      setLookedUpBooking(res.data);
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Booking not found');
    } finally {
      setLookupLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="history-loading">
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  return (
    <div className="history-page container page-enter">
      <h2 className="history-title">My Bookings</h2>

      {/* ── LOGGED IN: show all bookings ── */}
      {user ? (
        <div className="history-section">
          <p className="history-sub">
            Showing all bookings for <strong>{user.name}</strong>
          </p>

          {loadingBookings && (
            <div className="history-loading-inline">
              <div className="spinner spinner-dark" />
              <span>Loading your bookings...</span>
            </div>
          )}

          {!loadingBookings && bookingsError && (
            <div className="history-error">⚠️ {bookingsError}</div>
          )}

          {!loadingBookings && !bookingsError && myBookings.length === 0 && (
            <div className="history-empty">
              <span>🎫</span>
              <p>No bookings yet.</p>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Book a Bus
              </button>
            </div>
          )}

          {!loadingBookings && myBookings.length > 0 && (
            <div className="my-bookings-list">
              {myBookings.map((bk) => (
                <div key={bk.id} className="booking-item card">
                  <div className="booking-item-main">
                    <div className="booking-item-info">
                      <h3 className="booking-bus-name">{bk.busName}</h3>
                      <p className="booking-route">
                        📍 {bk.stops[0]?.stopName} → {bk.stops[bk.stops.length - 1]?.stopName}
                      </p>
                      <p className="booking-time">
                        🕐 {getDepartureTime(bk.stops)} – {getArrivalTime(bk.stops)}
                      </p>
                      <div className="booking-tags">
                        <span className="badge badge-gray">
                          {bk.seatsBooked.length} seat{bk.seatsBooked.length > 1 ? 's' : ''}: {bk.seatsBooked.join(', ')}
                        </span>
                        <span className={`badge ${bk.isAC ? 'badge-blue' : 'badge-gray'}`}>
                          {bk.isAC ? '❄️ AC' : 'Non-AC'}
                        </span>
                        <span className="badge badge-gray">
                          {new Date(bk.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <div className="booking-item-right">
                      <span className="booking-price">{formatPrice(bk.totalPrice)}</span>
                      <button
                        className="btn btn-outline view-btn"
                        onClick={() => navigate(`/confirmation/${bk.id}`)}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Also allow ID lookup even when logged in */}
          <div className="divider-text">or look up any booking by ID</div>
          <GuestLookup
            bookingId={bookingId}
            setBookingId={setBookingId}
            handleLookup={handleLookup}
            lookupLoading={lookupLoading}
            lookupError={lookupError}
            lookedUpBooking={lookedUpBooking}
            navigate={navigate}
          />
        </div>
      ) : (
        /* ── GUEST: prompt to login or look up by ID ── */
        <div className="history-section">
          <div className="guest-prompt card">
            <span className="guest-icon">👤</span>
            <h3>Track your bookings easily</h3>
            <p>Log in to see all your bookings in one place, or look up a booking by its ID below.</p>
            <button className="btn btn-primary" onClick={() => navigate('/login', { state: { from: '/bookings' } })}>
              Log In / Sign Up
            </button>
          </div>

          <div className="divider-text">or look up a booking by ID</div>
          <GuestLookup
            bookingId={bookingId}
            setBookingId={setBookingId}
            handleLookup={handleLookup}
            lookupLoading={lookupLoading}
            lookupError={lookupError}
            lookedUpBooking={lookedUpBooking}
            navigate={navigate}
          />
        </div>
      )}
    </div>
  );
}

/* ── Reusable guest lookup section ── */
function GuestLookup({
  bookingId, setBookingId, handleLookup,
  lookupLoading, lookupError, lookedUpBooking, navigate,
}: {
  bookingId: string;
  setBookingId: (v: string) => void;
  handleLookup: (e: React.FormEvent) => void;
  lookupLoading: boolean;
  lookupError: string;
  lookedUpBooking: BookingDetail | null;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div>
      <form className="lookup-form card" onSubmit={handleLookup}>
        <div className="form-group lookup-group">
          <label className="form-label">Booking ID</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. b2587d1c-29f8-4b0f-..."
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={lookupLoading || !bookingId.trim()}
        >
          {lookupLoading ? <><span className="spinner" /> Searching...</> : 'Search'}
        </button>
      </form>

      {lookupError && <div className="history-error">⚠️ {lookupError}</div>}

      {lookedUpBooking && (
        <div className="lookup-result card page-enter">
          <div className="result-header">
            <div>
              <h3 className="result-bus-name">{lookedUpBooking.busName}</h3>
              <p className="result-route">
                {lookedUpBooking.stops[0]?.stopName} → {lookedUpBooking.stops[lookedUpBooking.stops.length - 1]?.stopName}
              </p>
              <p className="result-time">
                🕐 {getDepartureTime(lookedUpBooking.stops)} – {getArrivalTime(lookedUpBooking.stops)}
              </p>
            </div>
            <div className="result-right">
              <span className="result-price">{formatPrice(lookedUpBooking.totalPrice)}</span>
              <span className="result-seats-badge">
                {lookedUpBooking.seatsBooked.length} seat{lookedUpBooking.seatsBooked.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="result-details">
            <div className="result-detail-row">
              <span className="detail-label">Seats</span>
              <span>{lookedUpBooking.seatsBooked.join(', ')}</span>
            </div>
            <div className="result-detail-row">
              <span className="detail-label">Booked On</span>
              <span>{new Date(lookedUpBooking.createdAt).toLocaleString('en-IN')}</span>
            </div>
            <div className="result-detail-row">
              <span className="detail-label">Passengers</span>
              <span>{lookedUpBooking.passengers.map((p) => p.name).join(', ')}</span>
            </div>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => navigate(`/confirmation/${lookedUpBooking.id}`)}
          >
            View Full Details →
          </button>
        </div>
      )}
    </div>
  );
}
