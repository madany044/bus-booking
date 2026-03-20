import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

// Hard require — returns 401 if no valid token
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

// Soft require — attaches user if token present, continues either way
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      (req as any).user = payload;
    } catch {
      // Invalid token — just ignore, continue as guest
    }
  }
  next();
}
