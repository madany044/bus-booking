import { useEffect, useState, useCallback } from 'react';
import { Seat } from '../../types';
import './SeatMap.css';

interface Props {
  seats: Seat[];
  selectedSeats: number[];
  onSelect: (seatNumber: number) => void;
  reservationExpiry: Date | null;
}

export default function SeatMap({ seats, selectedSeats, onSelect, reservationExpiry }: Props) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const calcTimeLeft = useCallback(() => {
    if (!reservationExpiry) return 0;
    const diff = Math.max(0, Math.floor((reservationExpiry.getTime() - Date.now()) / 1000));
    return diff;
  }, [reservationExpiry]);

  useEffect(() => {
    if (!reservationExpiry) return;
    setTimeLeft(calcTimeLeft());
    const interval = setInterval(() => {
      const t = calcTimeLeft();
      setTimeLeft(t);
      if (t === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [reservationExpiry, calcTimeLeft]);

  // Build grid: find max row and col
  const maxRow = Math.max(...seats.map((s) => s.row));
  const maxCol = Math.max(...seats.map((s) => s.column));

  // Map seat by row/col for quick lookup
  const seatMap = new Map<string, Seat>();
  seats.forEach((s) => seatMap.set(`${s.row}-${s.column}`, s));

  function getSeatStatus(seat: Seat): 'available' | 'selected' | 'booked' {
    if (selectedSeats.includes(seat.seatNumber)) return 'selected';
    if (!seat.isAvailable) return 'booked';
    return 'available';
  }

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const ss = (timeLeft % 60).toString().padStart(2, '0');
  const timerWarning = timeLeft > 0 && timeLeft <= 30;

  return (
    <div className="seatmap-wrap">
      {reservationExpiry && timeLeft > 0 && (
        <div className={`reservation-timer ${timerWarning ? 'timer-warning' : ''}`}>
          <span>🔒 Seats reserved for</span>
          <span className="timer-countdown">{mm}:{ss}</span>
          <span>— complete booking before it expires</span>
        </div>
      )}

      {reservationExpiry && timeLeft === 0 && (
        <div className="reservation-timer timer-expired">
          ⚠️ Reservation expired. Please reselect your seats.
        </div>
      )}

      <div className="seatmap-grid" style={{ '--max-col': maxCol } as React.CSSProperties}>
        {/* Aisle indicator */}
        <div className="bus-front">🚌 Front</div>
        <div className="seat-grid">
          {Array.from({ length: maxRow }, (_, rowIdx) => (
            <div key={rowIdx} className="seat-row">
              {Array.from({ length: maxCol }, (_, colIdx) => {
                // Add aisle gap after column 2 for normal buses
                const seat = seatMap.get(`${rowIdx + 1}-${colIdx + 1}`);
                return (
                  <div key={colIdx} className={`seat-cell ${colIdx === 1 && maxCol > 2 ? 'after-aisle' : ''}`}>
                    {seat ? (
                      <button
                        className={`seat-btn seat-${getSeatStatus(seat)}`}
                        onClick={() => getSeatStatus(seat) !== 'booked' && onSelect(seat.seatNumber)}
                        disabled={getSeatStatus(seat) === 'booked'}
                        title={`Seat ${seat.seatNumber}${seat.sleeperLevel ? ` (${seat.sleeperLevel})` : ''}`}
                      >
                        {seat.seatNumber}
                        {seat.sleeperLevel && (
                          <span className="sleeper-indicator">
                            {seat.sleeperLevel === 'upper' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="seat-empty" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="seat-legend">
        <span className="legend-item"><span className="legend-swatch swatch-available" />Available</span>
        <span className="legend-item"><span className="legend-swatch swatch-selected" />Selected</span>
        <span className="legend-item"><span className="legend-swatch swatch-booked" />Booked</span>
      </div>
    </div>
  );
}
