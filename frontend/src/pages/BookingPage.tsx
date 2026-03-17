import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { BusWithSeats, Passenger, BookingResponse } from '../types';
import PassengerForm from '../components/booking/PassengerForm';
import { formatPrice, getDepartureTime, getArrivalTime } from '../utils/helpers';
import './BookingPage.css';

export default function BookingPage() {
  const { busId } = useParams<{ busId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const seatsParam = searchParams.get('seats') || '';
  const selectedSeats = seatsParam ? seatsParam.split(',').map(Number).filter(Boolean) : [];
  const date = searchParams.get('date') || '';
  const departureCity = searchParams.get('departureCity') || '';
  const arrivalCity = searchParams.get('arrivalCity') || '';

  const [bus, setBus] = useState<BusWithSeats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [passengers, setPassengers] = useState<Passenger[]>(
    selectedSeats.map(() => ({ name: '', age: '', gender: '' }))
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!busId) return;
    if (selectedSeats.length === 0) {
      navigate(-1);
      return;
    }
    api.get<BusWithSeats>(`/buses/${busId}`)
      .then((res) => setBus(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load bus'))
      .finally(() => setLoading(false));
  }, [busId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePassengerChange(index: number, field: keyof Passenger, value: string | number) {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    const key = `${index}-${field}`;
    if (formErrors[key]) {
      setFormErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  }

  function validate() {
    const errors: Record<string, string> = {};
    passengers.forEach((p, i) => {
      if (!p.name.trim()) errors[`${i}-name`] = 'Name is required';
      else if (p.name.trim().length < 2) errors[`${i}-name`] = 'Name too short';
      if (!p.age) errors[`${i}-age`] = 'Age is required';
      else if (Number(p.age) < 1 || Number(p.age) > 120) errors[`${i}-age`] = 'Invalid age';
      if (!p.gender) errors[`${i}-gender`] = 'Gender is required';
    });
    return errors;
  }

  async function handleConfirm() {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await api.post<BookingResponse>('/bookings', {
        busId,
        seats: selectedSeats,
        passengerDetails: passengers.map((p) => ({
          name: p.name.trim(),
          age: Number(p.age),
          gender: p.gender,
        })),
      });
      navigate(`/confirmation/${res.data.id}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="booking-page-loading">
        <div className="spinner spinner-dark" />
        <span>Loading...</span>
      </div>
    );
  }

  if (error || !bus) {
    return (
      <div className="container">
        <div className="booking-page-error card">
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
    <div className="booking-page container page-enter">
      <h2 className="booking-page-title">Payment & Booking Confirmation</h2>

      <div className="booking-layout">
        {/* Left: passenger details */}
        <div className="booking-left">
          <div className="card booking-passengers-card">
            <h3 className="section-title">Passenger Details</h3>
            <PassengerForm
              passengers={passengers}
              onChange={handlePassengerChange}
              errors={formErrors}
            />
          </div>

          {submitError && (
            <div className="submit-error">⚠️ {submitError}</div>
          )}

          <button
            className="btn btn-primary confirm-btn"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? <><span className="spinner" /> Processing...</> : 'Confirm Booking'}
          </button>
        </div>

        {/* Right: bus details + summary */}
        <div className="booking-right">
          <div className="card booking-info-card">
            <h3 className="section-title">Bus Details</h3>
            <p className="info-bus-name">{bus.name}</p>
            <p className="info-row">{bus.isAC ? 'AC' : 'Non-AC'} · {bus.seatTypes.join(', ')}</p>
            <p className="info-row">📍 {departureCity || bus.stops[0]?.stopName} → {arrivalCity || bus.stops[bus.stops.length - 1]?.stopName}</p>
            {date && <p className="info-row">📅 {date}</p>}
            <p className="info-row">🕐 {depTime} – {arrTime}</p>
          </div>

          <div className="card booking-info-card">
            <h3 className="section-title">Booking Summary</h3>
            <div className="summary-line">
              <span>Selected Seats</span>
              <span>{selectedSeats.join(', ')}</span>
            </div>
            <div className="summary-line summary-line-total">
              <span>Total Price</span>
              <span className="summary-total-price">{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
