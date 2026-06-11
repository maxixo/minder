import express from 'express';
import {
  deleteSavedInspirationQuote,
  getSavedInspirationQuotes,
  getTodayInspiration,
  saveInspirationQuote,
} from '../controllers/inspirationController.js';
import { protect } from '../middleware/auth.js';
import {
  savedInspirationQuoteIdValidator,
  saveInspirationQuoteValidators,
} from '../middleware/requestValidators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);
router.get('/today', getTodayInspiration);
router.get('/saved', getSavedInspirationQuotes);
router.post('/saved', saveInspirationQuoteValidators, validate, saveInspirationQuote);
router.delete('/saved/:id', savedInspirationQuoteIdValidator, validate, deleteSavedInspirationQuote);

export default router;
