import type { NextFunction, Request, Response } from 'express';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const requireTrustedOrigin = (allowedOrigins: string[]) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    message: 'Request origin is not allowed.',
  });
};
