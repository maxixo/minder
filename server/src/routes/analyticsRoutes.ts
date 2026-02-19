import express from 'express';
import { getSummary, getMoodTrends, getEnergyPatterns, getActivityHeatmap, getWeeklyReport } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/summary',          getSummary);
router.get('/mood-trends',      getMoodTrends);
router.get('/energy-patterns',  getEnergyPatterns);
router.get('/activity-heatmap', getActivityHeatmap);
router.get('/weekly-report',    getWeeklyReport);

export default router;
