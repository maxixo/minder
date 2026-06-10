import express from 'express';
import {
  createCheckoutLink,
  getBillingStatus,
  getCustomerPortalLink,
  requestPremiumAccess,
} from '../controllers/billingController.js';
import { protect } from '../middleware/auth.js';
import { billingIntervalValidators } from '../middleware/requestValidators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
router.use(protect);

router.get('/status', getBillingStatus);
router.post('/checkout', billingIntervalValidators, validate, createCheckoutLink);
router.get('/portal', getCustomerPortalLink);
router.post('/upgrade-interest', billingIntervalValidators, validate, requestPremiumAccess);

export default router;
