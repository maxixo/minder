import { createHash } from 'node:crypto';

const DEFAULT_AVATAR_FOLDER = 'mindfullife/avatars';
const AVATAR_DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i;
const CLOUDINARY_RETRY_DELAYS_MS = [300, 900];
const TRANSIENT_FETCH_ERROR_CODES = new Set([
  'EAI_AGAIN',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
]);

export const MAX_AVATAR_UPLOAD_BYTES = 2 * 1024 * 1024;

const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const avatarFolder = process.env.CLOUDINARY_AVATAR_FOLDER?.trim() || DEFAULT_AVATAR_FOLDER;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary avatar uploads are not configured on the server.');
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    avatarFolder,
  };
};

const getDecodedBase64Size = (value: string) => {
  const sanitizedValue = value.replace(/\s+/g, '');
  const padding = sanitizedValue.endsWith('==') ? 2 : sanitizedValue.endsWith('=') ? 1 : 0;

  return Math.floor((sanitizedValue.length * 3) / 4) - padding;
};

const createSignature = (params: Record<string, string>, apiSecret: string) => {
  const signatureBase = Object.entries(params)
    .filter(([, value]) => value !== '')
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return createHash('sha1')
    .update(`${signatureBase}${apiSecret}`)
    .digest('hex');
};

const parseCloudinaryErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json() as { error?: { message?: string } };
    return payload?.error?.message || 'Cloudinary request failed.';
  } catch {
    return 'Cloudinary request failed.';
  }
};

const wait = (delayMs: number) => new Promise((resolve) => {
  setTimeout(resolve, delayMs);
});

const getErrorCauseCode = (error: unknown) => {
  if (!(error instanceof Error)) return null;

  const errorWithCause = error as Error & { cause?: unknown };
  const cause = typeof errorWithCause.cause === 'object' && errorWithCause.cause !== null
    ? errorWithCause.cause as { code?: unknown }
    : null;

  return typeof cause?.code === 'string' ? cause.code : null;
};

export const isTransientCloudinaryFetchError = (error: unknown) => {
  const causeCode = getErrorCauseCode(error);
  return Boolean(causeCode && TRANSIENT_FETCH_ERROR_CODES.has(causeCode));
};

export const isRetriableCloudinaryStatus = (status: number) => (
  status === 429 || status >= 500
);

const getFetchFailureMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return 'Cloudinary request failed before a response was received.';
  }

  const errorWithCause = error as Error & { cause?: unknown };
  const cause = typeof errorWithCause.cause === 'object' && errorWithCause.cause !== null
    ? errorWithCause.cause as { message?: unknown; code?: unknown }
    : null;

  const causeDetails = [
    typeof cause?.code === 'string' ? cause.code : null,
    typeof cause?.message === 'string' ? cause.message : null,
  ].filter(Boolean);

  if (!causeDetails.length) {
    return error.message || 'Cloudinary request failed before a response was received.';
  }

  return `${error.message}: ${causeDetails.join(' - ')}`;
};

const fetchCloudinaryWithRetry = async (
  input: string,
  initFactory: () => RequestInit,
) => {
  let lastErrorMessage = 'Cloudinary request failed before a response was received.';

  for (let attempt = 0; attempt <= CLOUDINARY_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(input, initFactory());

      if (!response.ok) {
        const errorMessage = await parseCloudinaryErrorMessage(response);

        if (attempt < CLOUDINARY_RETRY_DELAYS_MS.length && isRetriableCloudinaryStatus(response.status)) {
          lastErrorMessage = errorMessage;
          await wait(CLOUDINARY_RETRY_DELAYS_MS[attempt]);
          continue;
        }

        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      const errorMessage = getFetchFailureMessage(error);

      if (attempt < CLOUDINARY_RETRY_DELAYS_MS.length && isTransientCloudinaryFetchError(error)) {
        lastErrorMessage = errorMessage;
        await wait(CLOUDINARY_RETRY_DELAYS_MS[attempt]);
        continue;
      }

      throw new Error(errorMessage);
    }
  }

  throw new Error(lastErrorMessage);
};

const getAvatarPublicId = (userId: string) => `user-${userId}`;

const getAvatarAssetPublicId = (userId: string, avatarFolder: string) => (
  avatarFolder ? `${avatarFolder}/${getAvatarPublicId(userId)}` : getAvatarPublicId(userId)
);

export const isCloudinaryConfigured = () => (
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim()
    && process.env.CLOUDINARY_API_KEY?.trim()
    && process.env.CLOUDINARY_API_SECRET?.trim()
  )
);

export const validateAvatarUploadDataUrl = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new Error('Avatar file is required.');
  }

  const trimmedValue = value.trim();
  const match = trimmedValue.match(AVATAR_DATA_URL_PATTERN);

  if (!match) {
    throw new Error('Avatar files must be PNG, JPEG, WEBP, or GIF images.');
  }

  const fileSize = getDecodedBase64Size(match[2]);

  if (fileSize <= 0) {
    throw new Error('Avatar file is empty.');
  }

  if (fileSize > MAX_AVATAR_UPLOAD_BYTES) {
    throw new Error(`Avatar images must be ${Math.floor(MAX_AVATAR_UPLOAD_BYTES / (1024 * 1024))}MB or smaller.`);
  }

  return trimmedValue;
};

export const uploadAvatarImage = async ({
  dataUrl,
  userId,
}: {
  dataUrl: unknown;
  userId: string;
}) => {
  const normalizedDataUrl = validateAvatarUploadDataUrl(dataUrl);
  const { cloudName, apiKey, apiSecret, avatarFolder } = getCloudinaryConfig();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const publicId = getAvatarPublicId(userId);

  const signature = createSignature({
    folder: avatarFolder,
    invalidate: 'true',
    overwrite: 'true',
    public_id: publicId,
    timestamp,
  }, apiSecret);

  const body = new FormData();
  body.set('api_key', apiKey);
  body.set('file', normalizedDataUrl);
  body.set('folder', avatarFolder);
  body.set('invalidate', 'true');
  body.set('overwrite', 'true');
  body.set('public_id', publicId);
  body.set('signature', signature);
  body.set('timestamp', timestamp);

  const response = await fetchCloudinaryWithRetry(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, () => ({
      method: 'POST',
      body,
    }));

  const payload = await response.json() as { secure_url?: string };

  if (!payload.secure_url?.trim()) {
    throw new Error('Cloudinary did not return a secure avatar URL.');
  }

  return payload.secure_url.trim();
};

export const deleteAvatarImage = async (userId: string) => {
  const { cloudName, apiKey, apiSecret, avatarFolder } = getCloudinaryConfig();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const publicId = getAvatarAssetPublicId(userId, avatarFolder);

  const signature = createSignature({
    invalidate: 'true',
    public_id: publicId,
    timestamp,
  }, apiSecret);

  const body = new URLSearchParams({
    api_key: apiKey,
    invalidate: 'true',
    public_id: publicId,
    signature,
    timestamp,
  });

  await fetchCloudinaryWithRetry(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, () => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    }));
};
