import type { NextFunction, Response } from 'express';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { serializeUser } from '../lib/serializers.js';
import type { AuthRequest } from '../types/auth.js';

export const getTokenFromAuthorizationHeader = (authorizationHeader: string | string[] | undefined) => {
  const headerValue = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;
  if (typeof headerValue !== 'string') return null;

  const [scheme, token] = headerValue.trim().split(/\s+/, 2);
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

  return token;
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromAuthorizationHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload & { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = serializeUser(user);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

export const generateToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] });
