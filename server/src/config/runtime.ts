const DEFAULT_CLIENT_ORIGIN = 'http://localhost:5173';

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const isPositiveInteger = (value: string) => /^\d+$/.test(value) && Number.parseInt(value, 10) > 0;

export const isProductionEnvironment = (nodeEnv = process.env.NODE_ENV) => nodeEnv === 'production';

export const normalizeOrigin = (origin: string) => {
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

const isValidHttpOrigin = (origin: string) => {
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const parseAllowedOrigins = (clientUrl = process.env.CLIENT_URL) => {
  const rawOrigins = (clientUrl?.trim() ? clientUrl : DEFAULT_CLIENT_ORIGIN)
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  return Array.from(new Set(rawOrigins));
};

export const getRuntimeConfigErrors = (env: NodeJS.ProcessEnv = process.env) => {
  const errors: string[] = [];
  const effectiveCsrfSecret = env.CSRF_SECRET?.trim() || env.JWT_SECRET?.trim() || '';

  if (!env.DATABASE_URL?.trim()) {
    errors.push('DATABASE_URL is required.');
  }

  if (!env.CLIENT_URL?.trim()) {
    errors.push('CLIENT_URL is required.');
  } else {
    const invalidOrigins = parseAllowedOrigins(env.CLIENT_URL).filter((origin) => !isValidHttpOrigin(origin));
    if (invalidOrigins.length) {
      errors.push(`CLIENT_URL contains invalid origins: ${invalidOrigins.join(', ')}`);
    }
  }

  if (!env.JWT_SECRET?.trim()) {
    errors.push('JWT_SECRET is required.');
  } else if (isProductionEnvironment(env.NODE_ENV) && env.JWT_SECRET.trim().length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters in production.');
  }

  if (!effectiveCsrfSecret) {
    errors.push('CSRF_SECRET or JWT_SECRET is required.');
  } else if (isProductionEnvironment(env.NODE_ENV) && effectiveCsrfSecret.length < 32) {
    errors.push('CSRF_SECRET or JWT_SECRET must be at least 32 characters in production.');
  }

  if (env.PORT && !isPositiveInteger(env.PORT.trim())) {
    errors.push('PORT must be a positive integer.');
  }

  if (env.RATE_LIMIT_WINDOW_MS && !isPositiveInteger(env.RATE_LIMIT_WINDOW_MS.trim())) {
    errors.push('RATE_LIMIT_WINDOW_MS must be a positive integer.');
  }

  if (env.RATE_LIMIT_MAX_REQUESTS && !isPositiveInteger(env.RATE_LIMIT_MAX_REQUESTS.trim())) {
    errors.push('RATE_LIMIT_MAX_REQUESTS must be a positive integer.');
  }

  if (env.REQUEST_TIMEOUT_MS && !isPositiveInteger(env.REQUEST_TIMEOUT_MS.trim())) {
    errors.push('REQUEST_TIMEOUT_MS must be a positive integer.');
  }

  if (env.KEEP_ALIVE_TIMEOUT_MS && !isPositiveInteger(env.KEEP_ALIVE_TIMEOUT_MS.trim())) {
    errors.push('KEEP_ALIVE_TIMEOUT_MS must be a positive integer.');
  }

  return errors;
};

export const assertRuntimeConfig = (env: NodeJS.ProcessEnv = process.env) => {
  const errors = getRuntimeConfigErrors(env);

  if (!errors.length) return;

  throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
};
