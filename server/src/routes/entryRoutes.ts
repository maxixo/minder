import express from 'express';
import { createEntry, getEntries, getEntry, getEntryInsight, getEntryByDate, getTodayEntry, getRecentEntries, updateEntry, autoSaveEntry, deleteEntry } from '../controllers/entryController.js';
import { protect } from '../middleware/auth.js';
import {
  entryCollectionValidators,
  entryDateParamValidator,
  entryIdParamValidator,
  entryPayloadValidators,
  recentEntriesValidators,
} from '../middleware/requestValidators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
router.use(protect);

router.get('/today',        getTodayEntry);
router.get('/recent',       recentEntriesValidators, validate, getRecentEntries);
router.get('/date/:date',   entryDateParamValidator, validate, getEntryByDate);
router.get('/:id/insight',  entryIdParamValidator, validate, getEntryInsight);
router.patch('/:id/autosave', entryIdParamValidator, entryPayloadValidators, validate, autoSaveEntry);
router.route('/')
  .get(entryCollectionValidators, validate, getEntries)
  .post(entryPayloadValidators, validate, createEntry);
router.route('/:id')
  .get(entryIdParamValidator, validate, getEntry)
  .put(entryIdParamValidator, entryPayloadValidators, validate, updateEntry)
  .delete(entryIdParamValidator, validate, deleteEntry);

export default router;
