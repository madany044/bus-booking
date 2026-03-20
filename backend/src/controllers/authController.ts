import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool';
import { AppError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const IS_PROD = process.env.NODE_ENV === 'production';

function setTokenCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }
    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email address', 400);
    }

    // Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    if (existing.rows.length > 0) {
      throw new AppError('An account with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );
    const user = result.rows[0];

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    setTokenCookie(res, token);

    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    setTokenCookie(res, token);

    res.json({
      message: 'Logged in successfully',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: IS_PROD ? 'none' : 'lax',
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) throw new AppError('User not found', 404);

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
}
