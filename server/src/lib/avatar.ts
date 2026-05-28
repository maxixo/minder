const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export const isAllowedAvatarUrl = (value: string) => {
  try {
    const url = new URL(value);

    if (url.protocol === 'https:') {
      return true;
    }

    return url.protocol === 'http:' && LOCALHOST_HOSTNAMES.has(url.hostname);
  } catch {
    return false;
  }
};
