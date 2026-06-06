import express from 'express';
import { getTodayInspiration } from '../controllers/inspirationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/today', getTodayInspiration);

export default router;
