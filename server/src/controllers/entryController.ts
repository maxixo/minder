import type { Response } from 'express';
import prisma from '../lib/prisma.js';
import { parseEntryDateInput } from '../lib/date.js';
import { mergeEntryPatch, normalizeEntry } from '../lib/entry.js';
import { buildEntryPersistenceInput, serializeEntry } from '../lib/serializers.js';
import type { AuthRequest } from '../types/auth.js';

const buildDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return undefined;

  return {
    ...(startDate ? { gte: parseEntryDateInput(startDate) } : {}),
    ...(endDate ? { lte: parseEntryDateInput(endDate) } : {}),
  };
};

const resolvePersistedEntryPatch = (existingEntry: any, patch: Record<string, unknown>) => {
  const currentEntry = serializeEntry(existingEntry);
  const nextEntry = normalizeEntry(mergeEntryPatch(currentEntry, patch));
  return buildEntryPersistenceInput(nextEntry);
};

export const createEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entryDate = parseEntryDateInput(req.body?.date);
    const data = buildEntryPersistenceInput({
      ...req.body,
      userId: req.user.id,
      date: entryDate.toISOString(),
    });

    const entry = await prisma.entry.create({
      data: {
        userId: req.user.id,
        ...data,
      },
    });

    res.status(201).json({ success: true, data: serializeEntry(entry) });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Entry already exists for this date. Use PUT to update.' });
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEntries = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const dateRange = buildDateRange(req.query.startDate as string | undefined, req.query.endDate as string | undefined);
    const where = {
      userId: req.user.id,
      ...(dateRange ? { entryDate: dateRange } : {}),
    };

    const [entries, count] = await Promise.all([
      prisma.entry.findMany({
        where,
        orderBy: { entryDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.entry.count({ where }),
    ]);

    res.json({
      success: true,
      data: entries.map(serializeEntry),
      pagination: { total: count, page, pages: Math.ceil(count / limit) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.entry.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: serializeEntry(entry) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEntryByDate = async (req: AuthRequest, res: Response) => {
  try {
    const entryDate = parseEntryDateInput(req.params.date);
    const entry = await prisma.entry.findUnique({
      where: { userId_entryDate: { userId: req.user.id, entryDate } },
    });

    res.json({ success: true, data: entry ? serializeEntry(entry) : null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTodayEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.entry.findUnique({
      where: { userId_entryDate: { userId: req.user.id, entryDate: parseEntryDateInput(new Date()) } },
    });

    res.json({ success: true, data: entry ? serializeEntry(entry) : null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRecentEntries = async (req: AuthRequest, res: Response) => {
  try {
    const days = Number(req.query.days) || 7;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const entries = await prisma.entry.findMany({
      where: { userId: req.user.id, entryDate: { gte: parseEntryDateInput(cutoff) } },
      orderBy: { entryDate: 'desc' },
    });

    res.json({ success: true, data: entries.map(serializeEntry) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.entry.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

    const { userId: _ignoredUserId, id: _ignoredId, ...patch } = req.body || {};
    const updatedEntry = await prisma.entry.update({
      where: { id: entry.id },
      data: resolvePersistedEntryPatch(entry, patch),
    });

    res.json({ success: true, data: serializeEntry(updatedEntry) });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Entry already exists for this date. Use PUT to update.' });
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

export const autoSaveEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.entry.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

    const updatedEntry = await prisma.entry.update({
      where: { id: entry.id },
      data: resolvePersistedEntryPatch(entry, req.body || {}),
    });

    res.json({ success: true, data: serializeEntry(updatedEntry), message: 'Auto-saved' });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Entry already exists for this date. Use PUT to update.' });
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.entry.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

    await prisma.entry.delete({ where: { id: entry.id } });
    res.json({ success: true, message: 'Entry deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
