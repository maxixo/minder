import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const ALLOWED_FETCH_SITES = new Set(['same-origin', 'same-site', 'cross-site', 'none']);
const TOKEN_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || '';

export const CSRF_COOKIE_NAME = 'mindful_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const getTokenFromHeader = (headerValue: string | string[] | undefined) => {
  if (typeof headerValue === 'string') return headerValue.trim() || null;
  if (Array.isArray(headerValue)) {
    return typeof headerValue[0] === 'string' ? headerValue[0].trim() || null : null;
  }
  return null;
};

export const generateCsrfToken = (): string => {
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', CSRF_SECRET).update(timestamp).digest('hex');
  return `${timestamp}.${signature}`;
};

export const csrfTokensMatch = (_expected: string | null, received: string | null): boolean => {
  if (!received) return false;
  const [timestamp, signature] = received.split('.');
  if (!timestamp || !signature) return false;

  const expectedSignature = crypto.createHmac('sha256', CSRF_SECRET).update(timestamp).digest('hex');
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return false;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return false;

  const age = Date.now() - Number(timestamp);
  if (age < 0 || age > TOKEN_TTL_MS) return false;

  return true;
};

export const isAllowedFetchSite = (fetchSite: string | string[] | undefined) => {
  if (typeof fetchSite !== 'string' || !fetchSite) return true;
  return ALLOWED_FETCH_SITES.has(fetchSite);
};

export const getCsrfToken = (req: Request, res: Response) => {
  const csrfToken = generateCsrfToken();
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  res.json({ success: true, data: { csrfToken } });
};

export const requireCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }
  if (!isAllowedFetchSite(req.headers['sec-fetch-site'])) {
    res.status(403).json({ success: false, message: 'Cross-site requests are not allowed.' });
    return;
  }
  const headerToken = getTokenFromHeader(req.headers[CSRF_HEADER_NAME]);
  if (!csrfTokensMatch(null, headerToken)) {
    res.status(403).json({ success: false, message: 'CSRF token validation failed.' });
    return;
  }
  next();
};
