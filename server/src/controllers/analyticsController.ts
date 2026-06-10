import type { Response } from 'express';
import { format, subDays } from 'date-fns';
import prisma from '../lib/prisma.js';
import { buildAnalyticsPatternInsights } from '../lib/analyticsInsights.js';
import { formatDateParam, parseEntryDateInput } from '../lib/date.js';
import { getCompletionPercentage } from '../lib/entry.js';
import { sendInternalServerError } from '../lib/http.js';
import { serializeEntry } from '../lib/serializers.js';
import { generateUserInsightSummary, getThemeTrendSummary, type InsightPeriod } from '../services/insightService.js';
import type { AuthRequest } from '../types/auth.js';

const periodStart = (period: string | undefined) => {
  const map: Record<string, number> = { '7days': 7, '30days': 30, '90days': 90, 'year': 365 };
  return parseEntryDateInput(subDays(new Date(), map[period || ''] || 30));
};

const average = (values: Array<number | null | undefined>) => {
  const filtered = values.filter((value): value is number => value != null);
  return filtered.length ? +(filtered.reduce((sum, value) => sum + value, 0) / filtered.length).toFixed(1) : 0;
};

const resolveInsightPeriod = (value: unknown): InsightPeriod => {
  const period = typeof value === 'string' ? value : '30days';
  return ['7days', '30days', '90days', 'year'].includes(period) ? period as InsightPeriod : '30days';
};

export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const start = periodStart(req.query.period as string | undefined);

    const [entryWindow, allEntries] = await Promise.all([
      prisma.entry.findMany({
        where: { userId: req.user.id, entryDate: { gte: start } },
        orderBy: { entryDate: 'asc' },
      }),
      prisma.entry.findMany({
        where: { userId: req.user.id },
        orderBy: { entryDate: 'asc' },
        select: { entryDate: true },
      }),
    ]);

    let streak = 0;
    const dateSet = new Set(allEntries.map((entry) => formatDateParam(entry.entryDate)));
    let cursor = parseEntryDateInput(new Date());

    while (dateSet.has(formatDateParam(cursor))) {
      streak += 1;
      cursor = parseEntryDateInput(subDays(cursor, 1));
    }

    const serializedEntries = entryWindow.map(serializeEntry);

    res.json({
      success: true,
      data: {
        totalEntries: allEntries.length,
        currentStreak: streak,
        averageMood: average(entryWindow.map((entry) => entry.mood)),
        averageWaterIntake: average(entryWindow.map((entry) => entry.waterIntake)),
        averageSleepHours: average(entryWindow.map((entry) => entry.sleepHours)),
        completionRate: serializedEntries.length
          ? Math.round(serializedEntries.reduce((sum, entry) => sum + getCompletionPercentage(entry), 0) / serializedEntries.length)
          : 0,
      },
    });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Get analytics summary failed');
  }
};

export const getMoodTrends = async (req: AuthRequest, res: Response) => {
  try {
    const start = periodStart(req.query.period as string | undefined);
    const entries = await prisma.entry.findMany({
      where: { userId: req.user.id, entryDate: { gte: start }, mood: { not: null } },
      select: { entryDate: true, mood: true },
      orderBy: { entryDate: 'asc' },
    });

    res.json({
      success: true,
      data: entries.map((entry) => ({ date: format(entry.entryDate, 'yyyy-MM-dd'), mood: entry.mood })),
    });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Get mood trends failed');
  }
};

export const getEnergyPatterns = async (req: AuthRequest, res: Response) => {
  try {
    const entries = await prisma.entry.findMany({
      where: { userId: req.user.id },
      select: { energyLevels: true },
    });

    const totals = new Map<number, { total: number; count: number }>();

    entries.forEach((entry) => {
      const points = Array.isArray(entry.energyLevels) ? entry.energyLevels : [];
      points.forEach((point: any) => {
        if (typeof point?.time !== 'number' || typeof point?.energy !== 'number') return;
        const current = totals.get(point.time) || { total: 0, count: 0 };
        totals.set(point.time, { total: current.total + point.energy, count: current.count + 1 });
      });
    });

    const data = [...totals.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, value]) => ({ hour, averageEnergy: +(value.total / value.count).toFixed(1) }));

    res.json({ success: true, data });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Get energy patterns failed');
  }
};

export const getWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const start = parseEntryDateInput(subDays(new Date(), 7));
    const entries = await prisma.entry.findMany({
      where: { userId: req.user.id, entryDate: { gte: start } },
    });

    const feelingCounts: Record<string, number> = {};

    entries.forEach((entry) => {
      [entry.feeling, ...(Array.isArray(entry.additionalFeelings) ? entry.additionalFeelings : [])]
        .filter(Boolean)
        .forEach((feeling) => {
          const key = String(feeling);
          feelingCounts[key] = (feelingCounts[key] || 0) + 1;
        });
    });

    const topFeelings = Object.entries(feelingCounts)
      .map(([feeling, count]) => ({ feeling, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    res.json({
      success: true,
      data: {
        daysLogged: entries.length,
        averageMood: average(entries.map((entry) => entry.mood)),
        averageWaterIntake: average(entries.map((entry) => entry.waterIntake)),
        averageSleepHours: average(entries.map((entry) => entry.sleepHours)),
        topFeelings,
      },
    });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Get weekly report failed');
  }
};

export const getAiSummary = async (req: AuthRequest, res: Response) => {
  try {
    const summary = await generateUserInsightSummary(req.user.id, resolveInsightPeriod(req.query.period));
    res.json({ success: true, data: summary });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Get AI summary failed');
  }
};

export const getThemeTrends = async (req: AuthRequest, res: Response) => {
  try {
    const summary = await getThemeTrendSummary(req.user.id, resolveInsightPeriod(req.query.period));
    res.json({ success: true, data: summary });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Get AI theme trends failed');
  }
};

export const getPatternInsights = async (req: AuthRequest, res: Response) => {
  try {
    const period = resolveInsightPeriod(req.query.period);
    const periodLength = { '7days': 7, '30days': 30, '90days': 90, year: 365 }[period];
    const start = parseEntryDateInput(subDays(new Date(), (periodLength * 2) - 1));
    const entries = await prisma.entry.findMany({
      where: { userId: req.user.id, entryDate: { gte: start } },
      orderBy: { entryDate: 'asc' },
    });
    const insights = buildAnalyticsPatternInsights(entries.map(serializeEntry), period);

    res.json({ success: true, data: insights });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Get analytics pattern insights failed');
  }
};
