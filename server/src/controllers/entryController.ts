import type { Request, Response } from 'express';
import Entry from '../models/Entry.js';
import { startOfDay, endOfDay, subDays } from 'date-fns';

interface AuthRequest extends Request {
  user: any;
}

export const createEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entry = await Entry.create({
      ...req.body,
      userId: req.user._id,
      date: req.body.date ? new Date(req.body.date) : new Date(),
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err: any) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: 'Entry already exists for this date. Use PUT to update.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const query: any = { userId: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate)   query.date.$lte = new Date(endDate as string);
    }
    const [entries, count] = await Promise.all([
      Entry.find(query).sort({ date: -1 }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit)),
      Entry.countDocuments(query),
    ]);
    res.json({ success: true, data: entries, pagination: { total: count, page: Number(page), pages: Math.ceil(count / Number(limit)) } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEntryByDate = async (req: AuthRequest, res: Response) => {
  try {
    const d = new Date(req.params.date);
    const entry = await Entry.findOne({ userId: req.user._id, date: { $gte: startOfDay(d), $lte: endOfDay(d) } });
    res.json({ success: true, data: entry || null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTodayEntry = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    let entry = await Entry.findOne({ userId: req.user._id, date: { $gte: startOfDay(today), $lte: endOfDay(today) } });
    if (!entry) entry = await Entry.create({ userId: req.user._id, date: today });
    res.json({ success: true, data: entry });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRecentEntries = async (req: AuthRequest, res: Response) => {
  try {
    const days = Number(req.query.days) || 7;
    const entries = await Entry.find({ userId: req.user._id, date: { $gte: subDays(new Date(), days) } }).sort({ date: -1 });
    res.json({ success: true, data: entries });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    Object.entries(req.body).forEach(([k, v]) => { if (k !== 'userId' && k !== '_id') (entry as any)[k] = v; });
    await entry.save();
    res.json({ success: true, data: entry });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const autoSaveEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entry = await Entry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: false }
    );
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry, message: 'Auto-saved' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    await entry.deleteOne();
    res.json({ success: true, message: 'Entry deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
