import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getMe,
  acknowledgeDashboardWelcome,
  updateProfile,
  updatePassword,
  uploadProfileAvatar,
  deleteProfileAvatar,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { getCsrfToken } from '../middleware/csrf.js';
import { avatarUploadValidators, profileUpdateValidators } from '../middleware/requestValidators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/csrf', getCsrfToken);

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
  validate,
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
], login);

router.post('/logout', logout);

router.get('/me',       protect, getMe);
router.post('/dashboard-welcome/ack', protect, acknowledgeDashboardWelcome);
router.put('/profile',  protect, profileUpdateValidators, validate, updateProfile);
router.post('/profile/avatar', protect, avatarUploadValidators, validate, uploadProfileAvatar);
router.delete('/profile/avatar', protect, deleteProfileAvatar);
router.put('/password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validate,
], updatePassword);

export default router;
