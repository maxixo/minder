import express from 'express';
import {
  getPreferences,
  updatePreferences,
  getPushSubscriptionStatus,
  savePushSubscription,
  deletePushSubscription,
  sendTestPushNotification,
  exportData,
  deleteAccount,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/preferences',  getPreferences);
router.put('/preferences',  updatePreferences);
router.get('/push-subscriptions/status', getPushSubscriptionStatus);
router.post('/push-subscriptions', savePushSubscription);
router.delete('/push-subscriptions', deletePushSubscription);
router.post('/push-subscriptions/test', sendTestPushNotification);
router.get('/export',       exportData);
router.delete('/account',   deleteAccount);

export default router;
