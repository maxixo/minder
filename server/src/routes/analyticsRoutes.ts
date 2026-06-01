import express from 'express';
import { getSummary, getAiSummary, getThemeTrends, getMoodTrends, getEnergyPatterns, getActivityHeatmap, getWeeklyReport } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
import { activityHeatmapValidators, analyticsQueryValidators } from '../middleware/requestValidators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
router.use(protect);

router.get('/summary',          analyticsQueryValidators, validate, getSummary);
router.get('/ai-summary',       analyticsQueryValidators, validate, getAiSummary);
router.get('/mood-trends',      analyticsQueryValidators, validate, getMoodTrends);
router.get('/energy-patterns',  getEnergyPatterns);
router.get('/activity-heatmap', activityHeatmapValidators, validate, getActivityHeatmap);
router.get('/theme-trends',     analyticsQueryValidators, validate, getThemeTrends);
router.get('/weekly-report',    getWeeklyReport);

export default router;
