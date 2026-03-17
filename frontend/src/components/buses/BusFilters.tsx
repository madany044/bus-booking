import { BusFilters, DepartureSlot, SeatType } from '../../types';
import './BusFilters.css';

interface Props {
  filters: BusFilters;
  onChange: (filters: BusFilters) => void;
}

const seatTypes: { value: SeatType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'semi-sleeper', label: 'Semi Sleeper' },
  { value: 'sleeper', label: 'Sleeper' },
];

const slots: { value: DepartureSlot; label: string; time: string }[] = [
  { value: 'morning', label: 'Morning', time: '6 AM – 12 PM' },
  { value: 'afternoon', label: 'Afternoon', time: '12 PM – 4 PM' },
  { value: 'evening', label: 'Evening', time: '4 PM – 8 PM' },
  { value: 'night', label: 'Night', time: '8 PM – 6 AM' },
];

export default function BusFiltersSidebar({ filters, onChange }: Props) {
  function toggleSeatType(type: SeatType) {
    onChange({ ...filters, seatType: filters.seatType === type ? undefined : type });
  }

  function toggleAC(value: boolean) {
    onChange({ ...filters, isAC: filters.isAC === value ? undefined : value });
  }

  function toggleSlot(slot: DepartureSlot) {
    onChange({ ...filters, departureSlot: filters.departureSlot === slot ? undefined : slot });
  }

  function clearAll() {
    onChange({});
  }

  const hasFilters = filters.seatType || filters.isAC !== undefined || filters.departureSlot;

  return (
    <aside className="filters-sidebar card">
      <div className="filters-header">
        <h3>Filters</h3>
        {hasFilters && (
          <button className="clear-btn" onClick={clearAll}>Clear all</button>
        )}
      </div>

      <div className="filter-section">
        <p className="filter-title">Seat Type</p>
        <div className="filter-options">
          {seatTypes.map(({ value, label }) => (
            <label key={value} className="filter-option">
              <input
                type="checkbox"
                checked={filters.seatType === value}
                onChange={() => toggleSeatType(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <p className="filter-title">AC Type</p>
        <div className="filter-options">
          <label className="filter-option">
            <input
              type="checkbox"
              checked={filters.isAC === true}
              onChange={() => toggleAC(true)}
            />
            <span>AC</span>
          </label>
          <label className="filter-option">
            <input
              type="checkbox"
              checked={filters.isAC === false}
              onChange={() => toggleAC(false)}
            />
            <span>Non-AC</span>
          </label>
        </div>
      </div>

      <div className="filter-section">
        <p className="filter-title">Departure Time</p>
        <div className="filter-options">
          {slots.map(({ value, label, time }) => (
            <label key={value} className="filter-option slot-option">
              <input
                type="checkbox"
                checked={filters.departureSlot === value}
                onChange={() => toggleSlot(value)}
              />
              <span>
                <span className="slot-label">{label}</span>
                <span className="slot-time">{time}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
