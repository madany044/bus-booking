import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { BusWithSeats } from '../types';
import SeatMap from '../components/seats/SeatMap';
import { formatPrice, getDepartureTime, getArrivalTime } from '../utils/helpers';
import './SeatSelectionPage.css';

export default function SeatSelectionPage() {
  const { busId } = useParams<{ busId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [bus, setBus] = useState<BusWithSeats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState('');

  const date = searchParams.get('date') || '';
  const departureCity = searchParams.get('departureCity') || '';
  const arrivalCity = searchParams.get('arrivalCity') || '';

  useEffect(() => {
    if (!busId) return;
    setLoading(true);
    api.get<BusWithSeats>(`/buses/${busId}`)
      .then((res) => setBus(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load bus'))
      .finally(() => setLoading(false));
  }, [busId]);

  function toggleSeat(seatNumber: number) {
    // Reset reservation if user changes seat selection
    if (reservationExpiry) {
      setReservationExpiry(null);
    }
    setReserveError('');
    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : [...prev, seatNumber]
    );
  }

  async function handleProceed() {
    if (selectedSeats.length === 0) return;
    setReserving(true);
    setReserveError('');
    try {
      const res = await api.post<{ expiresAt: string }>('/reservations', {
        busId,
        seats: selectedSeats,
      });
      setReservationExpiry(new Date(res.data.expiresAt));
      navigate(`/booking/${busId}?seats=${selectedSeats.join(',')}&${searchParams.toString()}`);
    } catch (err: unknown) {
      setReserveError(err instanceof Error ? err.message : 'Failed to reserve seats');
    } finally {
      setReserving(false);
    }
  }

  if (loading) {
    return (
      <div className="seat-page-loading">
        <div className="spinner spinner-dark" />
        <span>Loading bus details...</span>
      </div>
    );
  }

  if (error || !bus) {
    return (
      <div className="container">
        <div className="seat-page-error card">
          <p>⚠️ {error || 'Bus not found'}</p>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const depTime = getDepartureTime(bus.stops);
  const arrTime = getArrivalTime(bus.stops);
  const totalPrice = bus.price * selectedSeats.length;

  return (
    <div className="seat-page container page-enter">
      {/* Bus details header */}
      <div className="bus-details-card card">
        <h2 className="bus-details-title">Bus Details</h2>
        <div className="bus-details-grid">
          <div>
            <p className="bus-detail-name">{bus.name}</p>
            <p className="bus-detail-sub">
              {bus.isAC ? 'AC' : 'Non-AC'} · {bus.seatTypes.join(', ')}
            </p>
            {date && <p className="bus-detail-sub">📅 {date}</p>}
          </div>
          <div className="bus-detail-right">
            <p className="bus-detail-route">📍 {departureCity || bus.stops[0]?.stopName} → {arrivalCity || bus.stops[bus.stops.length - 1]?.stopName}</p>
            <p className="bus-detail-time">🕐 {depTime} – {arrTime}</p>
          </div>
        </div>
      </div>

      <div className="seat-page-layout">
        {/* Seat map */}
        <div className="card seat-map-card">
          <h3 className="section-title">Select Your Seats</h3>
          <SeatMap
            seats={bus.seats}
            selectedSeats={selectedSeats}
            onSelect={toggleSeat}
            reservationExpiry={reservationExpiry}
          />
        </div>

        {/* Booking summary */}
        <div className="booking-summary card">
          <h3 className="section-title">Booking Summary</h3>
          <div className="summary-row">
            <span>Selected Seats</span>
            <span className="summary-value">
              {selectedSeats.length > 0
                ? `${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} (${selectedSeats.join(', ')})`
                : '—'}
            </span>
          </div>
          <div className="summary-row">
            <span>Price per seat</span>
            <span className="summary-value">{formatPrice(bus.price)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total Price</span>
            <span className="total-price">{selectedSeats.length > 0 ? formatPrice(totalPrice) : '₹ 0'}</span>
          </div>

          {reserveError && (
            <p className="reserve-error">{reserveError}</p>
          )}

          <button
            className="btn btn-primary proceed-btn"
            onClick={handleProceed}
            disabled={selectedSeats.length === 0 || reserving}
          >
            {reserving ? <><span className="spinner" /> Reserving...</> : 'Proceed to Payment'}
          </button>

          <p className="seats-note">
            ⏱ Selected seats will be held for 2 minutes after proceeding
          </p>
        </div>
      </div>
    </div>
  );
}
