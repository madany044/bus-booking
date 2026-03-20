import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { createTables } from './db/migrate';
 
dotenv.config();
 
const app = express();
const PORT = process.env.PORT || 5000;
 
// Allowed origins — supports main Vercel URL + all preview URLs
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
 
// Extract base domain for wildcard matching e.g. "bus-booking-platform" from full URL
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // allow curl/Postman
  if (origin === 'http://localhost:5173') return true;
  if (origin === 'http://localhost:5174') return true;
  if (origin === FRONTEND_URL) return true;
  // Allow all Vercel preview deployments for the same project
  // e.g. bus-booking-platform-7kij6zzb8-madans-projects-061a6083.vercel.app
  try {
    const mainHost = new URL(FRONTEND_URL).hostname; // e.g. bus-booking-platform-seven.vercel.app
    const projectBase = mainHost.split('-seven.vercel.app')[0]   // e.g. bus-booking-platform
                       || mainHost.split('.vercel.app')[0];
    if (origin.includes(projectBase) && origin.includes('vercel.app')) return true;
  } catch {
    // ignore URL parse errors
  }
  return false;
}
 
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
 
app.use(express.json());
app.use(cookieParser());
 
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
 
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);
 
async function start() {
  try {
    await createTables();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 FRONTEND_URL: ${FRONTEND_URL}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}
 
start();