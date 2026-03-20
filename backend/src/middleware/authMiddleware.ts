import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = req.cookies?.token;
    if (!token) {
      throw new AppError('Not authenticated. Please log in.', 401);
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Invalid or expired session. Please log in again.', 401));
  }
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      (req as any).userId = decoded.userId;
    }
  } catch {
    // Not logged in — that's fine for optional routes
  }
  next();
}
