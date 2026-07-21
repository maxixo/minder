import axios from 'axios';

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const resolveApiBaseUrl = () => {
  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

  if (!configuredApiUrl) {
    return '/api';
  }

  const normalizedApiUrl = trimTrailingSlashes(configuredApiUrl);
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

const fetchCsrfToken = async (forceRefresh = false) => {
  if (csrfToken && !forceRefresh) {
    return csrfToken;
  }

  if (!csrfTokenRequest || forceRefresh) {
    csrfTokenRequest = csrfApi.get('/auth/csrf')
      .then((response) => {
        const token = response.data?.data?.csrfToken;

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
    const token = await fetchCsrfToken();
    config.headers.set('X-CSRF-Token', token);
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
      const token = await fetchCsrfToken(true);
      retryConfig.headers.set('X-CSRF-Token', token);
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
