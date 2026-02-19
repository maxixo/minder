import express from 'express';
import { createEntry, getEntries, getEntry, getEntryByDate, getTodayEntry, getRecentEntries, updateEntry, autoSaveEntry, deleteEntry } from '../controllers/entryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/today',        getTodayEntry);
router.get('/recent',       getRecentEntries);
router.get('/date/:date',   getEntryByDate);
router.patch('/:id/autosave', autoSaveEntry);
router.route('/').get(getEntries).post(createEntry);
router.route('/:id').get(getEntry).put(updateEntry).delete(deleteEntry);

export default router;
