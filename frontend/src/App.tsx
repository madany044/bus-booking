import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import BusListPage from './pages/BusListPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import AuthPage from './pages/AuthPage';
import NotFoundPage from './pages/NotFoundPage';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/buses" element={<BusListPage />} />
              <Route path="/buses/:busId" element={<SeatSelectionPage />} />
              <Route path="/booking/:busId" element={<BookingPage />} />
              <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
              <Route path="/bookings" element={<BookingHistoryPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
