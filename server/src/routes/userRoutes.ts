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
import {
  deletePushSubscriptionValidators,
  preferenceUpdateValidators,
  pushSubscriptionValidators,
  testPushNotificationValidators,
} from '../middleware/requestValidators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
router.use(protect);

router.get('/preferences',  getPreferences);
router.put('/preferences',  preferenceUpdateValidators, validate, updatePreferences);
router.get('/push-subscriptions/status', getPushSubscriptionStatus);
router.post('/push-subscriptions', pushSubscriptionValidators, validate, savePushSubscription);
router.delete('/push-subscriptions', deletePushSubscriptionValidators, validate, deletePushSubscription);
router.post('/push-subscriptions/test', testPushNotificationValidators, validate, sendTestPushNotification);
router.get('/export',       exportData);
router.delete('/account',   deleteAccount);

export default router;
