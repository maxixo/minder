import type { Request, Response, NextFunction, CookieOptions } from 'express';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import User from '../models/User.js';

interface AuthRequest extends Request {
  user?: any;
}

export const SESSION_COOKIE_NAME = 'mindful_session';

const getCookieSecure = () => {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === 'true';
  return process.env.NODE_ENV === 'production';
};

const getCookieSameSite = (): CookieOptions['sameSite'] => {
  const configured = process.env.COOKIE_SAME_SITE?.toLowerCase();
  if (configured === 'lax' || configured === 'strict' || configured === 'none') {
    return configured;
  }
  return 'strict';
};

const parseCookieMaxAge = () => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (/^\d+$/.test(expiresIn)) {
    return Number(expiresIn) * 1000;
  }

  const match = expiresIn.match(/^(\d+)([smhd])$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
};

const getSessionCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: getCookieSecure(),
  sameSite: getCookieSameSite(),
  path: '/',
  maxAge: parseCookieMaxAge(),
});

const getTokenFromCookieHeader = (cookieHeader?: string) => {
  if (!cookieHeader) return null;

  const sessionCookie = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!sessionCookie) return null;

  return decodeURIComponent(sessionCookie.slice(SESSION_COOKIE_NAME.length + 1));
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cookieToken = getTokenFromCookieHeader(req.headers.cookie);
    const token = cookieToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload & { id: string };
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

export const generateToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] });

export const setSessionCookie = (res: Response, token: string) => {
  res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
};

export const clearSessionCookie = (res: Response) => {
  res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());
};
