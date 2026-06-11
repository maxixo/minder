import type { Response } from 'express';
import prisma from '../lib/prisma.js';
import { sendInternalServerError } from '../lib/http.js';
import { serializeSavedInspirationQuote } from '../lib/serializers.js';
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

export const getSavedInspirationQuotes = async (req: AuthRequest, res: Response) => {
  try {
    const quotes = await prisma.savedInspirationQuote.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: quotes.map(serializeSavedInspirationQuote) });
  } catch (error) {
    return sendInternalServerError(res, error, 'Get saved inspiration quotes failed');
  }
};

export const saveInspirationQuote = async (req: AuthRequest, res: Response) => {
  try {
    const quote = await prisma.savedInspirationQuote.upsert({
      where: {
        userId_quoteKey: {
          userId: req.user.id,
          quoteKey: req.body.quoteKey.trim(),
        },
      },
      update: {
        text: req.body.text.trim(),
        author: req.body.author.trim(),
        source: req.body.source,
        attribution: req.body.attribution?.trim() || null,
      },
      create: {
        userId: req.user.id,
        quoteKey: req.body.quoteKey.trim(),
        text: req.body.text.trim(),
        author: req.body.author.trim(),
        source: req.body.source,
        attribution: req.body.attribution?.trim() || null,
      },
    });

    return res.status(201).json({
      success: true,
      data: serializeSavedInspirationQuote(quote),
      message: 'Quote saved to your inspiration library',
    });
  } catch (error) {
    return sendInternalServerError(res, error, 'Save inspiration quote failed');
  }
};

export const deleteSavedInspirationQuote = async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.savedInspirationQuote.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!result.count) {
      return res.status(404).json({ success: false, message: 'Saved quote not found' });
    }

    return res.json({ success: true, data: null, message: 'Quote removed from your inspiration library' });
  } catch (error) {
    return sendInternalServerError(res, error, 'Delete saved inspiration quote failed');
  }
};
