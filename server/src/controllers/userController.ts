import type { Request, Response } from 'express';
import User from '../models/User.js';
import Entry from '../models/Entry.js';

interface AuthRequest extends Request {
  user: any;
}

export const getPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');
    res.json({ success: true, data: user.preferences });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { preferences: req.body } },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: user.preferences });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const exportData = async (req: AuthRequest, res: Response) => {
  try {
    const entries = await Entry.find({ userId: req.user._id }).lean();
    const user    = await User.findById(req.user._id).lean();
    res.setHeader('Content-Disposition', `attachment; filename="mindful-export-${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ user: { name: user.name, email: user.email }, entries }, null, 2));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    await Entry.deleteMany({ userId: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account and all data deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
