import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Bus, BusFilters, PaginatedBusesResponse } from '../types';
import BusCard from '../components/buses/BusCard';
import BusFiltersSidebar from '../components/buses/BusFilters';
import './BusListPage.css';

export default function BusListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const departureCity = searchParams.get('departureCity') || '';
  const arrivalCity = searchParams.get('arrivalCity') || '';
  const date = searchParams.get('date') || '';
  console.log('URL params:', { departureCity, arrivalCity, date }); // ADD THIS

  const [buses, setBuses] = useState<Bus[]>([]);
  const [filters, setFilters] = useState<BusFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBuses, setTotalBuses] = useState(0);

  const fetchBuses = useCallback(async (currentPage: number, currentFilters: BusFilters) => {
    if (!departureCity || !arrivalCity || !date) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {
        departureCity,
        arrivalCity,
        date,
        page: String(currentPage),
        pageSize: '10',
      };
      if (currentFilters.seatType) params.seatType = currentFilters.seatType;
      if (currentFilters.isAC !== undefined) params.isAC = String(currentFilters.isAC);
      if (currentFilters.departureSlot) params.departureSlot = currentFilters.departureSlot;

      const res = await api.get<PaginatedBusesResponse>('/buses', { params });
      setBuses(res.data.buses);
      setTotalPages(res.data.totalPages);
      setTotalBuses(res.data.totalBuses);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  }, [departureCity, arrivalCity, date, navigate]);

  // Initial load + whenever search params change
useEffect(() => {
  setPage(1);
  fetchBuses(1, filters);
}, [departureCity, arrivalCity, date]); // eslint-disable-line react-hooks/exhaustive-deps

// When filters change
useEffect(() => {
  setPage(1);
  fetchBuses(1, filters);
}, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

// When page changes
useEffect(() => {
  fetchBuses(page, filters);
}, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFiltersChange(newFilters: BusFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  return (
    <div className="buslist-page container page-enter">
      <div className="buslist-header">
        <div>
          <h2 className="buslist-title">Available Buses</h2>
          <p className="buslist-subtitle">
            {departureCity} → {arrivalCity} &nbsp;·&nbsp; {date}
            {!loading && ` · ${totalBuses} ${totalBuses === 1 ? 'bus' : 'buses'} found`}
          </p>
        </div>
        <button className="btn btn-outline back-btn" onClick={() => navigate('/')}>
          ← Modify Search
        </button>
      </div>

      <div className="buslist-layout">
        <BusFiltersSidebar filters={filters} onChange={handleFiltersChange} />

        <div className="buslist-results">
          {loading && (
            <div className="buslist-loading">
              <div className="spinner spinner-dark" />
              <span>Searching buses...</span>
            </div>
          )}

          {!loading && error && (
            <div className="buslist-error card">
              <span>⚠️ {error}</span>
              <button className="btn btn-outline" onClick={() => fetchBuses(page, filters)}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && buses.length === 0 && (
            <div className="buslist-empty card">
              <span className="empty-icon">🚌</span>
              <h3>No buses found</h3>
              <p>Try adjusting your filters or search for a different route.</p>
              <button className="btn btn-outline" onClick={() => setFilters({})}>
                Clear Filters
              </button>
            </div>
          )}

          {!loading && !error && buses.length > 0 && (
            <>
              <div className="buslist-cards">
                {buses.map((bus) => (
                  <BusCard key={bus.id} bus={bus} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Prev
                  </button>
                  <span className="page-info">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn btn-outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
