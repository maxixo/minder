import type { Response } from 'express';
import prisma from '../lib/prisma.js';
import {
  buildBillingSummary,
  getBillingPortalUrl,
  getCheckoutUrl,
  type BillingInterval,
} from '../lib/billing.js';
import { sendInternalServerError } from '../lib/http.js';
import type { AuthRequest } from '../types/auth.js';

export const getBillingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.set('Cache-Control', 'no-store');
    return res.json({ success: true, data: buildBillingSummary(user) });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Get billing status failed');
  }
};

export const createCheckoutLink = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.plan !== 'free' && ['trialing', 'active', 'past_due'].includes(user.subscriptionStatus)) {
      return res.status(409).json({ success: false, message: 'This account already has a managed subscription.' });
    }

    const interval = req.body.interval as BillingInterval;
    const url = getCheckoutUrl(interval);
    if (!url) {
      return res.status(503).json({
        success: false,
        message: 'Premium checkout is not configured yet. Request early access instead.',
      });
    }

    return res.json({ success: true, data: { url } });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Create billing checkout link failed');
  }
};

export const getCustomerPortalLink = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.plan === 'free') {
      return res.status(409).json({ success: false, message: 'Free accounts do not have a subscription to manage.' });
    }

    const url = getBillingPortalUrl();
    if (!url) {
      return res.status(503).json({ success: false, message: 'Subscription management is not configured yet.' });
    }

    return res.json({ success: true, data: { url } });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Get billing portal link failed');
  }
};

export const requestPremiumAccess = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        premiumInterestAt: new Date(),
        premiumInterestInterval: req.body.interval,
      },
    });

    return res.json({
      success: true,
      message: 'Premium access request saved.',
      data: buildBillingSummary(user),
    });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Request premium access failed');
  }
};
