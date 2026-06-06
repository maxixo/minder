import type { Response } from 'express';
import { sendInternalServerError } from '../lib/http.js';
import { getTodayInspirationQuote } from '../services/inspirationService.js';
import type { AuthRequest } from '../types/auth.js';

export const getTodayInspiration = async (req: AuthRequest, res: Response) => {
  try {
    const quote = await getTodayInspirationQuote();
    return res.json({ success: true, data: quote });
  } catch (error) {
    return sendInternalServerError(res, error, 'Get today inspiration failed');
  }
};
