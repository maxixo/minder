import { body, param, query, type ValidationChain } from 'express-validator';

const THEME_VALUES = ['light', 'dark', 'auto'];
const PERIOD_VALUES = ['7days', '30days', '90days', 'year'];
const REMINDER_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const booleanField = (field: string, message: string): ValidationChain => (
  body(field).optional().isBoolean().withMessage(message)
);

export const profileUpdateValidators: ValidationChain[] = [
  body('name')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty.')
    .isLength({ max: 120 })
    .withMessage('Name must be 120 characters or fewer.'),
  body('avatar')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 2048 })
    .withMessage('Avatar URL must be 2048 characters or fewer.'),
  body('preferences.theme')
    .optional()
    .isIn(THEME_VALUES)
    .withMessage('Theme must be light, dark, or auto.'),
  booleanField('preferences.notifications.dailyReminder', 'Daily reminder must be true or false.'),
  body('preferences.notifications.reminderTime')
    .optional()
    .matches(REMINDER_TIME_PATTERN)
    .withMessage('Reminder time must use HH:mm format.'),
  booleanField('preferences.notifications.weeklyReport', 'Weekly report must be true or false.'),
  body('preferences.notifications.timezone')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Timezone cannot be empty.'),
  booleanField('preferences.privacy.shareStats', 'Share stats must be true or false.'),
];

export const preferenceUpdateValidators: ValidationChain[] = [
  body('theme')
    .optional()
    .isIn(THEME_VALUES)
    .withMessage('Theme must be light, dark, or auto.'),
  booleanField('notifications.dailyReminder', 'Daily reminder must be true or false.'),
  body('notifications.reminderTime')
    .optional()
    .matches(REMINDER_TIME_PATTERN)
    .withMessage('Reminder time must use HH:mm format.'),
  booleanField('notifications.weeklyReport', 'Weekly report must be true or false.'),
  body('notifications.timezone')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Timezone cannot be empty.'),
  booleanField('privacy.shareStats', 'Share stats must be true or false.'),
];

export const pushSubscriptionValidators: ValidationChain[] = [
  body('subscription.endpoint')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('A push subscription endpoint is required.'),
  body('subscription.keys.p256dh')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('A push subscription p256dh key is required.'),
  body('subscription.keys.auth')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('A push subscription auth key is required.'),
  body('subscription.expirationTime')
    .optional({ nullable: true })
    .isInt()
    .withMessage('Push subscription expirationTime must be an integer.'),
  body('timezone')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Timezone cannot be empty.'),
];

export const deletePushSubscriptionValidators: ValidationChain[] = [
  body('endpoint')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('A push subscription endpoint is required.'),
];

export const testPushNotificationValidators: ValidationChain[] = [
  body('message')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Test notification messages must be 200 characters or fewer.'),
];

export const entryPayloadValidators: ValidationChain[] = [
  body()
    .isObject()
    .withMessage('Entry payload must be a JSON object.'),
  body('date')
    .optional()
    .matches(DATE_ONLY_PATTERN)
    .withMessage('Entry dates must use YYYY-MM-DD format.'),
];

export const entryCollectionValidators: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.'),
  query('startDate')
    .optional()
    .matches(DATE_ONLY_PATTERN)
    .withMessage('startDate must use YYYY-MM-DD format.'),
  query('endDate')
    .optional()
    .matches(DATE_ONLY_PATTERN)
    .withMessage('endDate must use YYYY-MM-DD format.'),
];

export const recentEntriesValidators: ValidationChain[] = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365.'),
];

export const analyticsQueryValidators: ValidationChain[] = [
  query('period')
    .optional()
    .isIn(PERIOD_VALUES)
    .withMessage('Period must be one of 7days, 30days, 90days, or year.'),
];

export const activityHeatmapValidators: ValidationChain[] = [
  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100.'),
];

export const entryIdParamValidator: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Entry id must be a valid UUID.'),
];

export const entryDateParamValidator: ValidationChain[] = [
  param('date')
    .matches(DATE_ONLY_PATTERN)
    .withMessage('Entry date must use YYYY-MM-DD format.'),
];
