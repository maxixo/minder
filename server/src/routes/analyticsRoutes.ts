import express from 'express';
import {
  getSummary,
  getAiSummary,
  getThemeTrends,
  getMoodTrends,
  getEnergyPatterns,
  getWeeklyReport,
  getPatternInsights,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
import { analyticsQueryValidators } from '../middleware/requestValidators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
router.use(protect);

router.get('/summary',          analyticsQueryValidators, validate, getSummary);
router.get('/ai-summary',       analyticsQueryValidators, validate, getAiSummary);
router.get('/mood-trends',      analyticsQueryValidators, validate, getMoodTrends);
router.get('/energy-patterns',  getEnergyPatterns);
router.get('/theme-trends',     analyticsQueryValidators, validate, getThemeTrends);
router.get('/pattern-insights', analyticsQueryValidators, validate, getPatternInsights);
router.get('/weekly-report',    getWeeklyReport);

export default router;
