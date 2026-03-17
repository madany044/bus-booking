import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bus } from '../../types';
import { formatPrice, getDepartureTime, getArrivalTime, getDuration } from '../../utils/helpers';
import './BusCard.css';

interface Props {
  bus: Bus;
}

export default function BusCard({ bus }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const depTime = getDepartureTime(bus.stops);
  const arrTime = getArrivalTime(bus.stops);
  const duration = getDuration(depTime, arrTime);
  const depCity = bus.stops[0]?.stopName || '';
  const arrCity = bus.stops[bus.stops.length - 1]?.stopName || '';

  function handleBook() {
    navigate(`/buses/${bus.id}?${searchParams.toString()}`);
  }

  return (
    <div className="bus-card card">
      <div className="bus-card-main">
        <div className="bus-info">
          <h3 className="bus-name">{bus.name}</h3>
          <div className="bus-route">
            <span className="route-icon">📍</span>
            <span>{depCity} → {arrCity}</span>
          </div>
          <div className="bus-time-row">
            <span className="time-icon">🕐</span>
            <span className="bus-time">
              {depTime}
              {duration && <span className="duration"> · {duration}</span>}
              {arrTime !== '--' && <> → {arrTime}</>}
            </span>
          </div>
          <div className="bus-tags">
            {bus.seatTypes.map((t) => (
              <span key={t} className="badge badge-gray">{t}</span>
            ))}
            <span className={`badge ${bus.isAC ? 'badge-blue' : 'badge-gray'}`}>
              {bus.isAC ? '❄️ AC' : 'Non-AC'}
            </span>
            <span className={`badge ${bus.availableSeats > 0 ? 'badge-green' : 'badge-amber'}`}>
              {bus.availableSeats > 0 ? `${bus.availableSeats} seats left` : 'Sold out'}
            </span>
          </div>
        </div>

        <div className="bus-card-right">
          <div className="bus-price">{formatPrice(bus.price)}</div>
          <div className="bus-price-label">per seat</div>
          <button
            className="btn btn-primary book-btn"
            onClick={handleBook}
            disabled={bus.availableSeats === 0}
          >
            {bus.availableSeats === 0 ? 'Sold Out' : 'Book Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
