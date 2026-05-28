const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export const getSafeAvatarUrl = (value: unknown) => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);

    if (url.protocol === 'https:') {
      return trimmed;
    }

    if (url.protocol === 'http:' && LOCALHOST_HOSTNAMES.has(url.hostname)) {
      return trimmed;
    }
  } catch {
    return null;
  }

  return null;
};
