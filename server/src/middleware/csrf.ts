import crypto from 'node:crypto';
import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { getCookieSameSite, getCookieSecure } from './auth.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const ALLOWED_FETCH_SITES = new Set(['same-origin', 'same-site', 'none']);

export const CSRF_COOKIE_NAME = 'mindful_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const getTokenFromCookieHeader = (cookieHeader?: string) => {
  if (!cookieHeader) return null;

  const csrfCookie = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${CSRF_COOKIE_NAME}=`));

  if (!csrfCookie) return null;

  return decodeURIComponent(csrfCookie.slice(CSRF_COOKIE_NAME.length + 1));
};

const getTokenFromHeader = (headerValue: string | string[] | undefined) => {
  if (typeof headerValue === 'string') {
    return headerValue.trim() || null;
  }

  if (Array.isArray(headerValue)) {
    return typeof headerValue[0] === 'string' ? headerValue[0].trim() || null : null;
  }

  return null;
};

const getCsrfCookieOptions = (): CookieOptions => ({
  httpOnly: false,
  secure: getCookieSecure(),
  sameSite: getCookieSameSite(),
  path: '/',
});

export const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

export const csrfTokensMatch = (expected: string | null, received: string | null) => {
  if (!expected || !received) return false;
  if (expected.length !== received.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
};

export const isAllowedFetchSite = (fetchSite: string | string[] | undefined) => {
  if (typeof fetchSite !== 'string' || !fetchSite) {
    return true;
  }

  return ALLOWED_FETCH_SITES.has(fetchSite);
};

export const issueCsrfToken = (res: Response) => {
  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  return token;
};

export const getOrCreateCsrfToken = (req: Request, res: Response) => (
  getTokenFromCookieHeader(req.headers.cookie) || issueCsrfToken(res)
);

export const getCsrfToken = (req: Request, res: Response) => {
  const csrfToken = getOrCreateCsrfToken(req, res);

  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  res.json({
    success: true,
    data: { csrfToken },
  });
};

export const requireCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  if (!isAllowedFetchSite(req.headers['sec-fetch-site'])) {
    res.status(403).json({
      success: false,
      message: 'Cross-site requests are not allowed.',
    });
    return;
  }

  const cookieToken = getTokenFromCookieHeader(req.headers.cookie);
  const headerToken = getTokenFromHeader(req.headers[CSRF_HEADER_NAME]);

  if (!csrfTokensMatch(cookieToken, headerToken)) {
    res.status(403).json({
      success: false,
      message: 'CSRF token validation failed.',
    });
    return;
  }

  next();
};
