import crypto from 'node:crypto';
import express, { type Request, type Response } from 'express';
import { runDailyReminders } from '../jobs/reminderJob.js';

const router = express.Router();

const getCronSecretFromHeader = (value: string | string[] | undefined) => {
  if (typeof value === 'string') {
    return value.trim() || null;
  }

  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0].trim() || null : null;
  }

  return null;
};

const secretsMatch = (expected: string | undefined, received: string | null) => {
  if (!expected || !received) return false;
  if (expected.length !== received.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
};

router.post('/reminders', async (req: Request, res: Response) => {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  const receivedSecret = getCronSecretFromHeader(req.headers['x-cron-secret']);

  if (!configuredSecret) {
    return res.status(503).json({
      success: false,
      message: 'CRON_SECRET is not configured.',
    });
  }

  if (!secretsMatch(configuredSecret, receivedSecret)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  try {
    await runDailyReminders();
    return res.json({
      success: true,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron reminder job failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Job failed',
    });
  }
});

export default router;
