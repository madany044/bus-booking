import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchForm.css';

export default function SearchForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    departureCity: '',
    arrivalCity: '',
    date: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.departureCity.trim()) newErrors.departureCity = 'Departure city is required';
    if (!form.arrivalCity.trim()) newErrors.arrivalCity = 'Arrival city is required';
    if (!form.date) newErrors.date = 'Date of travel is required';
    if (form.departureCity.trim().toLowerCase() === form.arrivalCity.trim().toLowerCase()) {
      newErrors.arrivalCity = 'Arrival city must differ from departure city';
    }
    return newErrors;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const params = new URLSearchParams({
      departureCity: form.departureCity.trim(),
      arrivalCity: form.arrivalCity.trim(),
      date: form.date,
    });
    navigate(`/buses?${params.toString()}`);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  return (
    <div className="search-section">
      <div className="search-hero">
        <h1 className="search-title">Find Your Bus</h1>
        <p className="search-subtitle">Search from hundreds of routes across India</p>
      </div>

      <form className="search-card card" onSubmit={handleSubmit}>
        <div className="search-fields">
          <div className="form-group">
            <label className="form-label" htmlFor="departureCity">
              Departure City
            </label>
            <div className="input-icon-wrap">
              <span className="input-icon">📍</span>
              <input
                id="departureCity"
                name="departureCity"
                className={`form-input with-icon ${errors.departureCity ? 'input-error' : ''}`}
                type="text"
                placeholder="e.g. Bangalore"
                value={form.departureCity}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
            {errors.departureCity && <span className="error-text">{errors.departureCity}</span>}
            <span className="form-hint">e.g. Bangalore, Chennai, Hosur, Vellore</span>
          </div>

          <div className="swap-icon" title="Swap cities" onClick={() => {
            setForm(prev => ({ ...prev, departureCity: prev.arrivalCity, arrivalCity: prev.departureCity }));
          }}>⇄</div>

          <div className="form-group">
            <label className="form-label" htmlFor="arrivalCity">
              Arrival City
            </label>
            <div className="input-icon-wrap">
              <span className="input-icon">🏁</span>
              <input
                id="arrivalCity"
                name="arrivalCity"
                className={`form-input with-icon ${errors.arrivalCity ? 'input-error' : ''}`}
                type="text"
                placeholder="e.g. Chennai"
                value={form.arrivalCity}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
            {errors.arrivalCity && <span className="error-text">{errors.arrivalCity}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="date">
              Date of Travel
            </label>
            <div className="input-icon-wrap">
              <span className="input-icon">📅</span>
              <input
                id="date"
                name="date"
                className={`form-input with-icon ${errors.date ? 'input-error' : ''}`}
                type="date"
                min={today}
                value={form.date}
                onChange={handleChange}
              />
            </div>
            {errors.date && <span className="error-text">{errors.date}</span>}
          </div>
        </div>

        <button type="submit" className="btn btn-primary search-btn">
          Search Buses
        </button>
      </form>
    </div>
  );
}
