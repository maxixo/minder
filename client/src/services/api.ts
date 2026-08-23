import axios, { AxiosHeaders, type AxiosRequestHeaders } from 'axios';

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');
const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value);
const isRelativeApiUrl = (value: string) => value.startsWith('/');

const getConfiguredApiUrl = () => {
  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

  if (!configuredApiUrl) {
    if (import.meta.env.DEV) {
      return '/api';
    }

    throw new Error('VITE_API_URL is missing. Set it in the client .env file.');
  }

  if (!isAbsoluteHttpUrl(configuredApiUrl) && !isRelativeApiUrl(configuredApiUrl)) {
    throw new Error('VITE_API_URL is invalid. Use an absolute URL or a relative /api path.');
  }

  return configuredApiUrl;
};

const resolveApiBaseUrl = () => {
  const normalizedApiUrl = trimTrailingSlashes(getConfiguredApiUrl());
  return normalizedApiUrl.endsWith('/api') ? normalizedApiUrl : `${normalizedApiUrl}/api`;
};

const baseURL = resolveApiBaseUrl();
const SAFE_METHODS = new Set(['get', 'head', 'options']);
const CSRF_ERROR_MESSAGE = 'CSRF token validation failed.';
const AUTH_TOKEN_STORAGE_KEY = 'mindful_auth_token';

let csrfToken: string | null = null;
let csrfTokenRequest: Promise<string> | null = null;

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  // Persisted token survives browser/PWA restarts so reminders keep firing.
  const localToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (localToken) return localToken;

  // Migrate legacy session-only tokens to localStorage.
  const sessionToken = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (sessionToken) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, sessionToken);
    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
  return sessionToken;
};

export const setAuthToken = (token: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearAuthToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

const csrfApi = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

const setCsrfHeader = (headers: AxiosRequestHeaders | undefined, token: string): AxiosRequestHeaders => {
  const nextHeaders = AxiosHeaders.from(headers);
  nextHeaders.set('x-csrf-token', token);
  return nextHeaders as AxiosRequestHeaders;
};

export const initializeCsrfToken = async (forceRefresh = false) => {
  if (csrfToken && !forceRefresh) {
    return csrfToken;
  }

  if (!csrfTokenRequest || forceRefresh) {
    csrfTokenRequest = csrfApi.get('/auth/csrf')
      .then((response) => {
        const token = response.data?.csrfToken || response.data?.data?.csrfToken;

        if (typeof token !== 'string' || !token) {
          throw new Error('Missing CSRF token in response.');
        }

        csrfToken = token;
        return token;
      })
      .finally(() => {
        csrfTokenRequest = null;
      });
  }

  return csrfTokenRequest;
};

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  const authToken = getAuthToken();

  if (authToken) {
    const nextHeaders = AxiosHeaders.from(config.headers);
    nextHeaders.set('Authorization', `Bearer ${authToken}`);
    config.headers = nextHeaders as AxiosRequestHeaders;
  }

  if (!SAFE_METHODS.has(method)) {
    const token = await initializeCsrfToken();
    config.headers = setCsrfHeader(config.headers, token);
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const retryConfig = err.config as typeof err.config & { _csrfRetried?: boolean };

    if (
      err.response?.status === 403
      && err.response?.data?.message === CSRF_ERROR_MESSAGE
      && retryConfig
      && !retryConfig._csrfRetried
    ) {
      retryConfig._csrfRetried = true;
      const token = await initializeCsrfToken(true);
      retryConfig.headers = setCsrfHeader(retryConfig.headers, token);
      return api.request(retryConfig);
    }

    const requestUrl = err.config?.url || '';
    const isAuthSubmission = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
    const isSessionCheck = requestUrl.includes('/auth/me');

    if (err.response?.status === 401 && !isAuthSubmission && !isSessionCheck) {
      clearAuthToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (err.response?.status === 401 && isSessionCheck) {
      clearAuthToken();
    }

    return Promise.reject(err);
  }
);

export default api;
