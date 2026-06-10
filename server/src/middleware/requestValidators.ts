import { body, param, query, type ValidationChain } from 'express-validator';
import { isAllowedAvatarUrl } from '../lib/avatar.js';
import { validateAvatarUploadDataUrl } from '../lib/cloudinary.js';

const THEME_VALUES = ['light', 'dark', 'auto'];
const PERIOD_VALUES = ['7days', '30days', '90days', 'year'];
const REMINDER_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ENTRY_SECTION_VALUES = ['reflection', 'selfcare', 'emotional', 'review'];
const WEATHER_VALUES = ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'stormy', 'snowy'];
const SLEEP_QUALITY_VALUES = ['poor', 'fair', 'good', 'great', 'excellent'];
const FEELING_VALUES = ['happy', 'peace', 'sad', 'worried', 'excited', 'bored', 'relaxed', 'lonely', 'tired', 'angry', 'overwhelmed'];
const GOAL_VALUES = ['better-sleep', 'reduce-stress', 'daily-focus', 'emotional-balance'];
const CADENCE_VALUES = ['daily', 'three-times-week', 'flexible'];
const BILLING_INTERVAL_VALUES = ['monthly', 'annual'];

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const booleanField = (field: string, message: string): ValidationChain => (
  body(field).optional().isBoolean().withMessage(message)
);

const assertOptionalString = (value: unknown, field: string, maxLength: number) => {
  if (value === undefined || value === null) return;
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string.`);
  }
  if (value.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  }
};

const assertOptionalNumber = (
  value: unknown,
  field: string,
  {
    integer = false,
    min,
    max,
  }: {
    integer?: boolean;
    min?: number;
    max?: number;
  } = {},
) => {
  if (value === undefined || value === null) return;
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${field} must be a number.`);
  }
  if (integer && !Number.isInteger(value)) {
    throw new Error(`${field} must be an integer.`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${field} must be at least ${min}.`);
  }
  if (max !== undefined && value > max) {
    throw new Error(`${field} must be no greater than ${max}.`);
  }
};

const assertOptionalBoolean = (value: unknown, field: string) => {
  if (value === undefined || value === null) return;
  if (typeof value !== 'boolean') {
    throw new Error(`${field} must be true or false.`);
  }
};

const assertOptionalEnumString = (value: unknown, field: string, values: string[]) => {
  if (value === undefined || value === null) return;
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string.`);
  }
  if (!values.includes(value)) {
    throw new Error(`${field} must be one of ${values.join(', ')}.`);
  }
};

const assertStringArray = (
  value: unknown,
  field: string,
  { maxItems, maxItemLength }: { maxItems: number; maxItemLength: number },
) => {
  if (value === undefined || value === null) return;
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array.`);
  }
  if (value.length > maxItems) {
    throw new Error(`${field} must contain ${maxItems} items or fewer.`);
  }

  value.forEach((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(`${field}[${index}] must be a string.`);
    }
    if (item.length > maxItemLength) {
      throw new Error(`${field}[${index}] must be ${maxItemLength} characters or fewer.`);
    }
  });
};

const assertRecordWithBooleans = (value: unknown, field: string, keys: string[]) => {
  if (value === undefined || value === null) return;
  if (!isPlainObject(value)) {
    throw new Error(`${field} must be an object.`);
  }

  keys.forEach((key) => {
    assertOptionalBoolean(value[key], `${field}.${key}`);
  });
};

const assertRecordWithNumbers = (
  value: unknown,
  field: string,
  keys: string[],
  options: { integer?: boolean; min?: number; max?: number } = {},
) => {
  if (value === undefined || value === null) return;
  if (!isPlainObject(value)) {
    throw new Error(`${field} must be an object.`);
  }

  keys.forEach((key) => {
    assertOptionalNumber(value[key], `${field}.${key}`, options);
  });
};

const validateEntryPayload = (payload: unknown) => {
  if (!isPlainObject(payload)) {
    throw new Error('Entry payload must be a JSON object.');
  }

  assertOptionalString(payload.weather, 'weather', 40);
  assertOptionalEnumString(payload.weather, 'weather', WEATHER_VALUES);
  assertStringArray(payload.gratitude, 'gratitude', { maxItems: 10, maxItemLength: 280 });
  assertOptionalString(payload.expectations, 'expectations', 2000);
  assertStringArray(payload.positiveNotes, 'positiveNotes', { maxItems: 10, maxItemLength: 280 });
  assertOptionalString(payload.whatMakesTodayGreat, 'whatMakesTodayGreat', 2000);
  assertStringArray(payload.goodThingsHappened, 'goodThingsHappened', { maxItems: 10, maxItemLength: 280 });
  assertOptionalString(payload.selfAssessmentNote, 'selfAssessmentNote', 2000);
  assertOptionalNumber(payload.mood, 'mood', { integer: true, min: 1, max: 5 });
  assertOptionalNumber(payload.waterIntake, 'waterIntake', { integer: true, min: 0, max: 100 });
  assertOptionalNumber(payload.sleepHours, 'sleepHours', { min: 0, max: 24 });
  assertOptionalString(payload.sleepQuality, 'sleepQuality', 120);
  assertOptionalEnumString(payload.sleepQuality, 'sleepQuality', SLEEP_QUALITY_VALUES);
  assertRecordWithBooleans(payload.meals, 'meals', ['breakfast', 'lunch', 'dinner', 'snack']);
  assertRecordWithNumbers(payload.nutrition, 'nutrition', ['calories', 'protein', 'carbs', 'fat'], { min: 0, max: 100000 });

  if (payload.energyLevels !== undefined && payload.energyLevels !== null) {
    if (!Array.isArray(payload.energyLevels)) {
      throw new Error('energyLevels must be an array.');
    }
    if (payload.energyLevels.length > 24) {
      throw new Error('energyLevels must contain 24 items or fewer.');
    }
    payload.energyLevels.forEach((item, index) => {
      if (!isPlainObject(item)) {
        throw new Error(`energyLevels[${index}] must be an object.`);
      }
      assertOptionalNumber(item.time, `energyLevels[${index}].time`, { integer: true, min: 0, max: 24 });
      assertOptionalNumber(item.energy, `energyLevels[${index}].energy`, { min: 0, max: 10 });
    });
  }

  if (payload.tomorrowPlan !== undefined && payload.tomorrowPlan !== null) {
    if (!isPlainObject(payload.tomorrowPlan)) {
      throw new Error('tomorrowPlan must be an object.');
    }
    assertOptionalString(payload.tomorrowPlan.howToMakeBetter, 'tomorrowPlan.howToMakeBetter', 2000);
    assertOptionalString(payload.tomorrowPlan.expectations, 'tomorrowPlan.expectations', 2000);
  }

  assertOptionalString(payload.selfLove, 'selfLove', 2000);
  assertOptionalString(payload.gratitudeNote, 'gratitudeNote', 2000);
  assertOptionalString(payload.feeling, 'feeling', 120);
  assertOptionalEnumString(payload.feeling, 'feeling', FEELING_VALUES);
  assertStringArray(payload.additionalFeelings, 'additionalFeelings', { maxItems: 10, maxItemLength: 120 });
  if (Array.isArray(payload.additionalFeelings)) {
    payload.additionalFeelings.forEach((item, index) => {
      if (!FEELING_VALUES.includes(item)) {
        throw new Error(`additionalFeelings[${index}] must be one of ${FEELING_VALUES.join(', ')}.`);
      }
    });
  }
  assertRecordWithNumbers(payload.activities, 'activities', ['reading', 'music', 'mindfulness'], { integer: true, min: 0, max: 1000 });
  assertOptionalString(payload.mindThoughts, 'mindThoughts', 4000);
  assertOptionalString(payload.nextStep, 'nextStep', 2000);
  assertRecordWithNumbers(payload.ratings, 'ratings', ['selfTalk', 'energyPoint', 'overall'], { min: 0, max: 10 });
  assertRecordWithBooleans(payload.selfCareChecklist, 'selfCareChecklist', [
    'ateBreakfast',
    'ateLunch',
    'ateDinner',
    'slept7to9Hours',
    'tookNap',
    'watchedMovie',
    'gotFreshAir',
    'exercised',
    'calledFriend',
    'journaled',
    'drankWater',
    'readBook',
    'listenedToMusic',
    'meditated',
    'stretched',
  ]);

  if (payload.customSelfCareChecklist !== undefined && payload.customSelfCareChecklist !== null) {
    if (!Array.isArray(payload.customSelfCareChecklist)) {
      throw new Error('customSelfCareChecklist must be an array.');
    }
    if (payload.customSelfCareChecklist.length > 20) {
      throw new Error('customSelfCareChecklist must contain 20 items or fewer.');
    }
    payload.customSelfCareChecklist.forEach((item, index) => {
      if (!isPlainObject(item)) {
        throw new Error(`customSelfCareChecklist[${index}] must be an object.`);
      }
      assertOptionalString(item.id, `customSelfCareChecklist[${index}].id`, 120);
      assertOptionalString(item.text, `customSelfCareChecklist[${index}].text`, 120);
      assertOptionalBoolean(item.completed, `customSelfCareChecklist[${index}].completed`);
    });
  }

  if (payload.emotionalGuidance !== undefined && payload.emotionalGuidance !== null) {
    if (!isPlainObject(payload.emotionalGuidance)) {
      throw new Error('emotionalGuidance must be an object.');
    }
    assertOptionalString(payload.emotionalGuidance.whereAreYou, 'emotionalGuidance.whereAreYou', 2000);
    assertOptionalString(payload.emotionalGuidance.howYoureFeeling, 'emotionalGuidance.howYoureFeeling', 2000);
    assertOptionalString(payload.emotionalGuidance.whatYoureThinking, 'emotionalGuidance.whatYoureThinking', 2000);
    assertOptionalString(payload.emotionalGuidance.copingMethod, 'emotionalGuidance.copingMethod', 280);
    assertOptionalString(payload.emotionalGuidance.feelingBeforeGo, 'emotionalGuidance.feelingBeforeGo', 2000);
  }

  if (payload.selfCarePlanDays !== undefined && payload.selfCarePlanDays !== null) {
    if (!isPlainObject(payload.selfCarePlanDays)) {
      throw new Error('selfCarePlanDays must be an object.');
    }
    Object.entries(payload.selfCarePlanDays).forEach(([key, value]) => {
      assertOptionalBoolean(value, `selfCarePlanDays.${key}`);
    });
  }

  assertStringArray(payload.priorities, 'priorities', { maxItems: 10, maxItemLength: 280 });

  if (payload.todoList !== undefined && payload.todoList !== null) {
    if (!Array.isArray(payload.todoList)) {
      throw new Error('todoList must be an array.');
    }
    if (payload.todoList.length > 50) {
      throw new Error('todoList must contain 50 items or fewer.');
    }
    payload.todoList.forEach((item, index) => {
      if (!isPlainObject(item)) {
        throw new Error(`todoList[${index}] must be an object.`);
      }
      assertOptionalString(item.id, `todoList[${index}].id`, 120);
      assertOptionalString(item.text, `todoList[${index}].text`, 280);
      assertOptionalBoolean(item.completed, `todoList[${index}].completed`);
    });
  }

  assertOptionalString(payload.focus, 'focus', 2000);
  assertOptionalString(payload.mindfulnessNotes, 'mindfulnessNotes', 4000);
  assertStringArray(payload.todayNotes, 'todayNotes', { maxItems: 10, maxItemLength: 280 });

  if (payload.completedSections !== undefined && payload.completedSections !== null) {
    if (!Array.isArray(payload.completedSections)) {
      throw new Error('completedSections must be an array.');
    }
    payload.completedSections.forEach((item, index) => {
      if (typeof item !== 'string' || !ENTRY_SECTION_VALUES.includes(item)) {
        throw new Error(`completedSections[${index}] must be one of ${ENTRY_SECTION_VALUES.join(', ')}.`);
      }
    });
  }

  return true;
};

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
    .withMessage('Avatar URL must be 2048 characters or fewer.')
    .custom((value) => !value || isAllowedAvatarUrl(value))
    .withMessage('Avatar URL must use HTTPS, or HTTP on localhost.'),
  body('goal')
    .optional({ nullable: true })
    .isIn(GOAL_VALUES)
    .withMessage(`Goal must be one of ${GOAL_VALUES.join(', ')}.`),
  body('cadence')
    .optional({ nullable: true })
    .isIn(CADENCE_VALUES)
    .withMessage(`Cadence must be one of ${CADENCE_VALUES.join(', ')}.`),
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

export const avatarUploadValidators: ValidationChain[] = [
  body('file')
    .custom((value) => {
      validateAvatarUploadDataUrl(value);
      return true;
    }),
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

export const billingIntervalValidators: ValidationChain[] = [
  body('interval')
    .isIn(BILLING_INTERVAL_VALUES)
    .withMessage('Billing interval must be monthly or annual.'),
];

export const entryPayloadValidators: ValidationChain[] = [
  body()
    .isObject()
    .withMessage('Entry payload must be a JSON object.')
    .custom(validateEntryPayload),
  body('date')
    .optional()
    .matches(DATE_ONLY_PATTERN)
    .withMessage('Entry dates must use YYYY-MM-DD format.'),
];

export const reflectionAssistValidators: ValidationChain[] = [
  body('packId')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('packId must be between 1 and 80 characters.'),
  body('entry')
    .isObject()
    .withMessage('entry must be a JSON object.')
    .custom(validateEntryPayload),
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
