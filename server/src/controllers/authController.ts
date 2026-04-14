import type { Request, Response } from 'express';
import User from '../models/User.js';
import { clearSessionCookie, generateToken, setSessionCookie } from '../middleware/auth.js';

interface AuthRequest extends Request {
  user: any;
}

const userPayload = (user: any) => ({
  id: user._id, name: user.name, email: user.email,
  avatar: user.avatar, preferences: user.preferences,
});

const setNoStore = (res: Response) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id.toString());

    setNoStore(res);
    setSessionCookie(res, token);
    res.status(201).json({ success: true, data: { user: userPayload(user) } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password') as any;
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = generateToken(user._id.toString());

    setNoStore(res);
    setSessionCookie(res, token);
    res.json({ success: true, data: { user: userPayload(user) } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const logout = async (_req: Request, res: Response) => {
  setNoStore(res);
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    setNoStore(res);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar, preferences } = req.body;
    const user = await User.findById(req.user._id) as any;
    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (preferences) user.preferences = { ...(user.preferences || {}), ...preferences };
    await user.save();
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password') as any;
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
