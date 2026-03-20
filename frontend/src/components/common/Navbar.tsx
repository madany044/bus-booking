import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
    }
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon">🚌</span>
          <span className="navbar-logo-text">BusSearch</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Home
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    to="/bookings"
                    className={location.pathname === '/bookings' ? 'active' : ''}
                  >
                    My Bookings
                  </Link>

                  {/* User dropdown */}
                  <div className="user-menu-wrap">
                    <button
                      className="user-btn"
                      onClick={() => setMenuOpen((o) => !o)}
                    >
                      <span className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="user-name">{user.name.split(' ')[0]}</span>
                      <span className="chevron">{menuOpen ? '▴' : '▾'}</span>
                    </button>

                    {menuOpen && (
                      <div className="user-dropdown">
                        <div className="dropdown-email">{user.email}</div>
                        <hr className="dropdown-divider" />
                        <Link
                          to="/bookings"
                          className="dropdown-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          📋 My Bookings
                        </Link>
                        <button
                          className="dropdown-item dropdown-logout"
                          onClick={handleLogout}
                          disabled={loggingOut}
                        >
                          {loggingOut ? 'Logging out...' : '🚪 Log Out'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className={`navbar-login-btn ${location.pathname === '/login' ? 'active' : ''}`}
                >
                  Log In
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {menuOpen && (
        <div className="dropdown-overlay" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  );
}
