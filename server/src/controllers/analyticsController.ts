import type { Request, Response } from 'express';
import Entry from '../models/Entry.js';
import { subDays, eachDayOfInterval, format } from 'date-fns';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user: any;
}

const periodStart = (period: string | undefined) => {
  const map: Record<string, number> = { '7days': 7, '30days': 30, '90days': 90, 'year': 365 };
  return subDays(new Date(), map[period || ''] || 30);
};

export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const start = periodStart(req.query.period as string | undefined);

    const entries = await Entry.find({ userId, date: { $gte: start } }).lean();
    const all     = await Entry.find({ userId }).sort({ date: 1 }).lean();

    // Streak
    let streak = 0;
    const dateSet = new Set(all.map(e => format(new Date(e.date), 'yyyy-MM-dd')));
    let check = new Date();
    while (dateSet.has(format(check, 'yyyy-MM-dd'))) {
      streak++;
      check = subDays(check, 1);
    }

    const avg = (arr: any[], key: string) => {
      const vals = arr.map(e => (e as any)[key]).filter(v => v != null);
      return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
    };

    res.json({
      success: true,
      data: {
        totalEntries: all.length,
        currentStreak: streak,
        averageMood: avg(entries, 'mood'),
        averageWaterIntake: avg(entries, 'waterIntake'),
        averageSleepHours: avg(entries, 'sleepHours'),
        completionRate: entries.length
          ? Math.round(entries.reduce((a, e) => {
              const m = new Entry(e); return a + m.getCompletionPercentage();
            }, 0) / entries.length)
          : 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMoodTrends = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const start  = periodStart(req.query.period as string | undefined);
    const entries = await Entry.find({ userId, date: { $gte: start }, mood: { $ne: null } })
      .select('date mood').sort({ date: 1 }).lean();
    res.json({
      success: true,
      data: entries.map(e => ({ date: format(new Date(e.date), 'yyyy-MM-dd'), mood: e.mood })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEnergyPatterns = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const result = await Entry.aggregate([
      { $match: { userId, 'energyLevels.0': { $exists: true } } },
      { $unwind: '$energyLevels' },
      { $group: { _id: '$energyLevels.time', avg: { $avg: '$energyLevels.energy' } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, hour: '$_id', averageEnergy: { $round: ['$avg', 1] } } },
    ]);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getActivityHeatmap = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const year   = parseInt(req.query.year as string) || new Date().getFullYear();
    const start  = new Date(year, 0, 1);
    const end    = new Date(year, 11, 31);

    const entries = await Entry.find({ userId, date: { $gte: start, $lte: end } })
      .select('date completedSections').lean();

    const entryMap: Record<string, number> = {};
    entries.forEach(e => {
      const key = format(new Date(e.date), 'yyyy-MM-dd');
      entryMap[key] = Math.round(((e.completedSections?.length || 0) / 4) * 100);
    });

    const days = eachDayOfInterval({ start, end }).map(d => {
      const key = format(d, 'yyyy-MM-dd');
      return { date: key, completionRate: entryMap[key] ?? 0 };
    });

    res.json({ success: true, data: days });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const start  = subDays(new Date(), 7);
    const entries = await Entry.find({ userId, date: { $gte: start } }).lean();

    const avg = (key: string) => {
      const vals = entries.map(e => (e as any)[key]).filter(v => v != null);
      return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
    };

    const feelingCounts: Record<string, number> = {};
    entries.forEach(e => {
      [e.feeling, ...(e.additionalFeelings || [])].filter(Boolean).forEach(f => {
        feelingCounts[f] = (feelingCounts[f] || 0) + 1;
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
        averageMood: avg('mood'),
        averageWaterIntake: avg('waterIntake'),
        averageSleepHours: avg('sleepHours'),
        topFeelings,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
