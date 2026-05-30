import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { sendInternalServerError } from '../lib/http.js';
import { deleteAvatarImage, isCloudinaryConfigured, uploadAvatarImage } from '../lib/cloudinary.js';
import { comparePassword, hashPassword } from '../lib/password.js';
import { serializeUser } from '../lib/serializers.js';
import { clearSessionCookie, generateToken, setSessionCookie } from '../middleware/auth.js';
import type { AuthRequest } from '../types/auth.js';

const setNoStore = (res: Response) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase();

    if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
      },
    });

    setNoStore(res);
    clearSessionCookie(res);
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please log in.',
      data: { user: serializeUser(user) },
    });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Register failed');
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    setNoStore(res);
    setSessionCookie(res, token);
    res.json({ success: true, data: { user: serializeUser(user) } });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Login failed');
  }
};

export const logout = async (_req: Request, res: Response) => {
  setNoStore(res);
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    setNoStore(res);
    res.json({ success: true, data: serializeUser(user) });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Get current user failed');
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar, preferences } = req.body;
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const normalizedAvatar = avatar === '' ? null : avatar;

    if (normalizedAvatar === null && currentUser.avatar && isCloudinaryConfigured()) {
      await deleteAvatarImage(req.user.id);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name ?? currentUser.name,
        avatar: normalizedAvatar !== undefined ? normalizedAvatar : currentUser.avatar,
        theme: preferences?.theme ?? currentUser.theme,
        dailyReminder: preferences?.notifications?.dailyReminder ?? currentUser.dailyReminder,
        reminderTime: preferences?.notifications?.reminderTime ?? currentUser.reminderTime,
        weeklyReport: preferences?.notifications?.weeklyReport ?? currentUser.weeklyReport,
        timezone: preferences?.notifications?.timezone ?? currentUser.timezone,
        shareStats: preferences?.privacy?.shareStats ?? currentUser.shareStats,
      },
    });

    res.json({ success: true, data: serializeUser(user) });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Update profile failed');
  }
};

export const uploadProfileAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ success: false, message: 'Cloudinary avatar uploads are not configured on the server.' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const avatarUrl = await uploadAvatarImage({
      dataUrl: req.body?.file,
      userId: req.user.id,
    });

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
    });

    res.json({ success: true, data: serializeUser(user) });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Upload profile avatar failed');
  }
};

export const deleteProfileAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (currentUser.avatar && isCloudinaryConfigured()) {
      await deleteAvatarImage(req.user.id);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: null },
    });

    res.json({ success: true, data: serializeUser(user) });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Delete profile avatar failed');
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!(await comparePassword(currentPassword, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    res.json({ success: true, message: 'Password updated' });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Update password failed');
  }
};
