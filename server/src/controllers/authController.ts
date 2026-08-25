import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { sendInternalServerError } from '../lib/http.js';
import { deleteAvatarImage, isCloudinaryConfigured, uploadAvatarImage } from '../lib/cloudinary.js';
import { comparePassword, hashPassword } from '../lib/password.js';
import { generateToken as generateOpaqueToken, hashToken, verifyToken as verifyStoredToken } from '../lib/tokens.js';
import email from '../lib/email.js';
import { OAuth2Client } from 'google-auth-library';
import { serializeUser } from '../lib/serializers.js';
import { generateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../types/auth.js';

const setNoStore = (res: Response) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
};

// Email verification + password reset token lifetimes
export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

/** Fire-and-forget welcome (incl. verification link) on signup. Never throws out of register. */
const sendSignupVerification = async (userId: string, emailAddress: string) => {
  try {
    const rawToken = generateOpaqueToken();
    const tokenHash = await hashToken(rawToken);

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      },
    });

    const appUrl = email.getAppUrl();
    const verifyLink = `${appUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
    await email.sendWelcomeEmail(emailAddress, verifyLink);
  } catch (err) {
    // Non-fatal: account is created regardless; log only.
    console.error('[auth] Failed to send signup verification email:', err);
  }
};

/** Fire-and-forget login notification. Never throws out of login. */
const sendLoginNotification = async (userId: string, emailAddress: string) => {
  try {
    await email.sendLoginNotificationEmail(emailAddress);
  } catch (err) {
    console.error('[auth] Failed to send login notification email:', err);
  }
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
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account before logging in.',
      data: { user: serializeUser(user) },
    });

    // Send verification email after responding (fire-and-forget, non-blocking).
    await sendSignupVerification(user.id, normalizedEmail);
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
    res.json({ success: true, data: { user: serializeUser(user), token } });

    // Notify on every successful login (fire-and-forget, non-blocking).
    await sendLoginNotification(user.id, normalizedEmail);
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Login failed');
  }
};

export const getGoogleConfig = (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || null;
  setNoStore(res);
  res.json({ success: true, data: { clientId } });
};

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

export const googleLogin = async (req: Request, res: Response) => {
  try {
    if (!googleClient || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ success: false, message: 'Google sign-in is not configured' });
    }

    const credential = typeof req.body?.credential === 'string' ? req.body.credential : '';
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Missing Google credential' });
    }

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ success: false, message: 'Google account email is not verified' });
    }

    const normalizedEmail = payload.email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          name: payload.name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          avatar: payload.picture || null,
        },
      });
    } else if (payload.picture && user.avatar !== payload.picture) {
      user = await prisma.user.update({ where: { id: user.id }, data: { avatar: payload.picture } });
    }

    const token = generateToken(user.id);

    setNoStore(res);
    res.json({ success: true, data: { user: serializeUser(user), token, isNewUser } });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Google login failed');
  }
};

export const logout = async (_req: Request, res: Response) => {
  setNoStore(res);
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

export const acknowledgeDashboardWelcome = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { hasSeenDashboardWelcome: true },
    });

    setNoStore(res);
    res.json({ success: true, data: { user: serializeUser(user) } });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Acknowledge dashboard welcome failed');
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar, goal, cadence, preferences } = req.body;
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const normalizedAvatar = avatar === '' ? null : avatar;
    const currentGoal = (currentUser as any).goal;
    const currentCadence = (currentUser as any).cadence;

    if (normalizedAvatar === null && currentUser.avatar && isCloudinaryConfigured()) {
      await deleteAvatarImage(req.user.id);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name ?? currentUser.name,
        avatar: normalizedAvatar !== undefined ? normalizedAvatar : currentUser.avatar,
        goal: goal ?? currentGoal,
        cadence: cadence ?? currentCadence,
        theme: preferences?.theme ?? currentUser.theme,
        dailyReminder: preferences?.notifications?.dailyReminder ?? currentUser.dailyReminder,
        reminderTime: preferences?.notifications?.reminderTime ?? currentUser.reminderTime,
        inspirationReminder: preferences?.notifications?.inspirationReminder ?? currentUser.inspirationReminder,
        inspirationReminderTime: preferences?.notifications?.inspirationReminderTime ?? currentUser.inspirationReminderTime,
        weeklyReport: preferences?.notifications?.weeklyReport ?? currentUser.weeklyReport,
        timezone: preferences?.notifications?.timezone ?? currentUser.timezone,
        shareStats: preferences?.privacy?.shareStats ?? currentUser.shareStats,
      } as any,
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

/**
 * Forgot password: generate a one-time reset token and email a reset link.
 * Always returns a generic response to avoid leaking which emails exist.
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email: emailAddress } = req.body;
    const normalizedEmail = String(emailAddress ?? '').trim().toLowerCase();

    const user = normalizedEmail ? await prisma.user.findUnique({ where: { email: normalizedEmail } }) : null;

    if (user) {
      const rawToken = generateOpaqueToken();
      const tokenHash = await hashToken(rawToken);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: tokenHash,
          resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const appUrl = email.getAppUrl();
      const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
      await email.sendPasswordResetEmail(user.email, resetLink);
    }

    // Always respond the same regardless of whether the email exists.
    setNoStore(res);
    res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Forgot password failed');
  }
};

/** Verify a new account via the emailed link (one-time token). */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    // Find the user whose stored hash matches this token.
    // Prisma can't query by hash, so we scan users with unverified email + pending token.
    const candidates = await prisma.user.findMany({
      where: {
        emailVerifiedAt: null,
        emailVerificationTokenHash: { not: null },
      },
      select: {
        id: true,
        emailVerificationTokenHash: true,
        emailVerificationTokenExpiresAt: true,
      },
    });

    let matchedUser: typeof candidates[number] | null = null;
    for (const c of candidates) {
      if (await verifyStoredToken(token, c.emailVerificationTokenHash)) {
        matchedUser = c;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    const notExpired = matchedUser.emailVerificationTokenExpiresAt
      ? matchedUser.emailVerificationTokenExpiresAt.getTime() > Date.now()
      : false;

    if (!notExpired) {
      return res.status(400).json({ success: false, message: 'Verification token has expired. Please register again.' });
    }

    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null,
      },
    });

    setNoStore(res);
    res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Verify email failed');
  }
};

/** Reset the password using a one-time token from the emailed link. */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required' });
    }
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    // Find user whose stored reset token hash matches.
    const candidates = await prisma.user.findMany({
      where: { resetTokenHash: { not: null } },
      select: {
        id: true,
        resetTokenHash: true,
        resetTokenExpiresAt: true,
      },
    });

    let matchedUser: typeof candidates[number] | null = null;
    for (const c of candidates) {
      if (await verifyStoredToken(token, c.resetTokenHash)) {
        matchedUser = c;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({ success: false, message: 'Invalid or already-used reset token' });
    }

    const notExpired = matchedUser.resetTokenExpiresAt
      ? matchedUser.resetTokenExpiresAt.getTime() > Date.now()
      : false;

    if (!notExpired) {
      return res.status(400).json({ success: false, message: 'Reset token has expired. Please request a new one.' });
    }

    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash: await hashPassword(String(newPassword)),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });

    setNoStore(res);
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Reset password failed');
  }
};
