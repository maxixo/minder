import axios, { AxiosHeaders, type AxiosRequestHeaders } from 'axios';

const DEFAULT_API_URL = 'https://minder.oshodiusman.xyz';
const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const resolveApiBaseUrl = () => {
  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
  const normalizedApiUrl = trimTrailingSlashes(configuredApiUrl || DEFAULT_API_URL);
  return normalizedApiUrl.endsWith('/api') ? normalizedApiUrl : `${normalizedApiUrl}/api`;
};

const baseURL = resolveApiBaseUrl();
const SAFE_METHODS = new Set(['get', 'head', 'options']);
const CSRF_ERROR_MESSAGE = 'CSRF token validation failed.';

let csrfToken: string | null = null;
let csrfTokenRequest: Promise<string> | null = null;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const csrfApi = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
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
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

export default api;
