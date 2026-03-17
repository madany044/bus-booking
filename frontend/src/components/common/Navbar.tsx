import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon">🚌</span>
          <span className="navbar-logo-text">BusSearch</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/bookings" className={location.pathname.startsWith('/bookings') ? 'active' : ''}>My Bookings</Link>
          <a href="mailto:careers@appweave.tech">Contact</a>
        </div>
      </div>
    </nav>
  );
}
