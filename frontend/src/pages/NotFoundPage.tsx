import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="notfound-page">
      <span className="notfound-icon">🚌</span>
      <h2>404 — Page Not Found</h2>
      <p>This route doesn't exist. Let's get you back on track.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
    </div>
  );
}
