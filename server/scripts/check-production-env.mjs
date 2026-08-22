import process from 'node:process';

const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

const normalizeOrigin = (origin) => {
  const trimmedOrigin = trimTrailingSlashes(origin.trim());

  try {
    const parsed = new URL(trimmedOrigin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return trimmedOrigin;
    }

    return parsed.origin;
  } catch {
    return trimmedOrigin;
  }
};

const parseAllowedOrigins = (clientUrl) => (
  (clientUrl?.trim() ? clientUrl : '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean)
);

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CSRF_SECRET',
  'CLIENT_URL',
  'CRON_SECRET',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
];

const errors = [];
const warnings = [];

for (const envVarName of requiredEnvVars) {
  if (!process.env[envVarName]?.trim()) {
    errors.push(`${envVarName} is required.`);
  }
}

if (process.env.DATABASE_URL && !/^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL)) {
  errors.push('DATABASE_URL must be a PostgreSQL connection string.');
}

if ((process.env.JWT_SECRET || '').trim().length > 0 && process.env.JWT_SECRET.trim().length < 32) {
  errors.push('JWT_SECRET must be at least 32 characters long.');
}

if ((process.env.CSRF_SECRET || '').trim().length > 0 && process.env.CSRF_SECRET.trim().length < 32) {
  errors.push('CSRF_SECRET must be at least 32 characters long.');
}

const configuredOrigins = parseAllowedOrigins(process.env.CLIENT_URL);
if (configuredOrigins.length === 0) {
  errors.push('CLIENT_URL must include at least one valid frontend origin.');
}

if ((process.env.NODE_ENV || '').trim() !== 'production') {
  warnings.push('NODE_ENV should be set to `production` on cPanel.');
}

if ((process.env.TRUST_PROXY || '').trim() !== '1') {
  warnings.push('TRUST_PROXY is usually `1` behind cPanel/Passenger.');
}

if (configuredOrigins.some((origin) => origin.includes('vercel.app'))) {
  warnings.push('Using a custom frontend domain is still recommended for production trust and branding, but API auth now uses Authorization bearer tokens instead of third-party cookies.');
}

if ((process.env.RUN_DAILY_REMINDER_JOB || '').trim().toLowerCase() === 'true') {
  warnings.push('RUN_DAILY_REMINDER_JOB is enabled. On cPanel, prefer `false` and trigger reminders through a cron job that calls `/api/cron/reminders`.');
}

if (errors.length > 0) {
  console.error('Production environment verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }

  if (warnings.length > 0) {
    console.error('');
    console.error('Warnings:');
    for (const warning of warnings) {
      console.error(`- ${warning}`);
    }
  }

  process.exit(1);
}

console.log('Production environment verification passed.');

if (warnings.length > 0) {
  console.log('');
  console.log('Warnings:');
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}
