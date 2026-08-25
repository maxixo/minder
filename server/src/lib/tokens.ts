import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

const TOKEN_BYTES = 32;      // 256-bit random token
const TOKEN_ENCODING: BufferEncoding = 'base64url';
const SCRYPT_KEYLEN = 64;

const normalizeToken = (token: string) => token.trim();

/** Hash a token for storage (scrypt, salted with the token itself as input salt derivation). */
export const hashToken = async (token: string): Promise<string> => {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(token, salt, SCRYPT_KEYLEN)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
};

/** Constant-time comparison of a candidate token against a stored hash. */
export const verifyToken = async (token: string, storedHash: string | null | undefined): Promise<boolean> => {
  if (!storedHash || !token) return false;

  const [salt, hashHex] = storedHash.split(':');
  if (!salt || !hashHex) return false;

  const candidate = (await scrypt(token, salt, SCRYPT_KEYLEN)) as Buffer;
  const expected = Buffer.from(hashHex, 'hex');

  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
};

/** Generate a fresh opaque token (the raw value is only shown once, in the email link). */
export const generateToken = (): string => randomBytes(TOKEN_BYTES).toString(TOKEN_ENCODING);

/** Deterministic hash of an email (used to fingerprint a login session, not required for v1). */
export const fingerprintEmail = (email: string): string =>
  createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
