import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/bookings';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
    setServerError('');
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (mode === 'register' && !form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Min 6 characters';
    if (mode === 'register' && form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setServerError('');
    try {
      if (mode === 'login') {
        await login(form.email.trim(), form.password);
      } else {
        await register(form.name.trim(), form.email.trim(), form.password);
      }
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setErrors({});
    setServerError('');
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <span className="auth-icon">🚌</span>
          <h2 className="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="auth-sub">
            {mode === 'login'
              ? 'Log in to view your bookings'
              : 'Sign up to track your bookings'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                name="name"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                type="text"
                placeholder="Rahul Kumar"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              name="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              name="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword}</span>
              )}
            </div>
          )}

          {serverError && (
            <div className="auth-server-error">{serverError}</div>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading
              ? <><span className="spinner" /> {mode === 'login' ? 'Logging in...' : 'Creating account...'}</>
              : mode === 'login' ? 'Log In' : 'Create Account'
            }
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <p>Don't have an account? <button className="link-btn" onClick={switchMode}>Sign up</button></p>
          ) : (
            <p>Already have an account? <button className="link-btn" onClick={switchMode}>Log in</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
