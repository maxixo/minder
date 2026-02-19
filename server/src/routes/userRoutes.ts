import express from 'express';
import { getPreferences, updatePreferences, exportData, deleteAccount } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/preferences',  getPreferences);
router.put('/preferences',  updatePreferences);
router.get('/export',       exportData);
router.delete('/account',   deleteAccount);

export default router;
