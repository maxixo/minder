import { Resend } from 'resend';

/**
 * Email service (Resend) with graceful fallback.
 *
 * Emails are sent through Resend when configured. When `RESEND_API_KEY`
 * is not set (e.g. local development before keys are provisioned) the
 * service silently skips sending and logs a notice instead of throwing,
 * so registration/login/reset flows never crash because mail is missing.
 *
 * Configuration (server/.env):
 *   RESEND_API_KEY  - Resend API key (required to actually send)
 *   EMAIL_FROM      - From address, e.g. "no-reply@yourdomain.com".
 *                     Defaults to Resend's shared test sender when unset.
 *   APP_URL         - Public app origin used to build email links.
 *                     Defaults to CLIENT_URL, then VERCEL_URL.
 */

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
};

const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY?.trim());

const DEFAULT_TEST_SENDER = 'onboarding@resend.dev';

const getFromAddress = () => {
  const from = process.env.EMAIL_FROM?.trim();
  return from || DEFAULT_TEST_SENDER;
};

/** Public origin used to build verification / reset links. */
export const getAppUrl = () => {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const client = process.env.CLIENT_URL?.trim().split(',')[0];
  if (client) return client.replace(/\/+$/, '');

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`.replace(/\/+$/, '');

  return 'http://localhost:5173';
};

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const sendEmail = async ({ to, subject, html, text }: SendEmailInput) => {
  const resend = getResend();

  if (!resend) {
    // Graceful fallback: don't break auth flows when mail isn't configured.
    console.warn(
      '[email] RESEND_API_KEY not configured; skipping email to "%s" (subject: "%s")',
      to,
      subject,
    );
    return { success: false as const, skipped: true as const };
  }

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[email] Resend send failed:', error);
      return { success: false as const, skipped: false as const };
    }

    return { success: true as const, skipped: false as const };
  } catch (err) {
    console.error('[email] Resend threw while sending:', err);
    return { success: false as const, skipped: false as const };
  }
};

// ---------------------------------------------------------------------------
// Brand (matches client theme: sage greens, warm sand neutrals, serif display)
// ---------------------------------------------------------------------------

const BRAND = {
  primary: '#44604a', // leaf stroke / wordmark
  primaryDeep: '#375541',
  primarySoft: '#d9e6d9',
  bg: '#faf9f6',
  surface: '#ffffff',
  border: '#e3e3df',
  text: '#1a1c1a',
  textMuted: '#424843',
  sand: '#a98566',
  sandSoft: '#f6f0e7',
} as const;

const DISPLAY_FONT = "Georgia, 'Times New Roman', serif";
const BODY_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Inline leaf mark (matches BrandLogo.tsx) + wordmark. */
const brandHeader = (appName = 'MindfulLife') => `
  <div style="text-align:center;margin-bottom:28px;">
    <div style="display:inline-flex;align-items:center;gap:10px;">
      <svg width="34" height="34" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <g transform="translate(2 0)">
          <path d="M38.25 10.75c-7.28 0-13 2.1-17 6.27-4.08 4.24-6.15 9.92-5.83 15.99.15 2.89 1.19 5.13 3.01 6.69 1.83 1.56 4.38 2.3 7.27 2.1 5.48-.38 10.54-4.02 13.87-9.93 3.08-5.48 4.2-12.69 3.08-19.79a1.5 1.5 0 0 0-1.48-1.28h-2.92Z" stroke="#44604A" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/>
          <path d="M20.75 35.75c2.35-5.74 6.23-10.83 11.55-15.17" stroke="#44604A" stroke-linecap="round" stroke-width="4"/>
        </g>
      </svg>
      <span style="font-family:${DISPLAY_FONT};font-size:24px;font-weight:600;letter-spacing:-0.01em;color:${BRAND.primary};">${appName}</span>
    </div>
  </div>
`;

const wrapInBrand = (title: string, bodyHtml: string, button?: { label: string; href: string; note?: string }) => `
  <!DOCTYPE html>
  <html lang="en">
    <body style="margin:0;padding:0;background:${BRAND.bg};font-family:${BODY_FONT};">
      <div style="max-width:480px;margin:0 auto;padding:32px 20px;">
        ${brandHeader()}
        <div style="background:${BRAND.surface};border-radius:16px;padding:36px 30px;border:1px solid ${BRAND.border};box-shadow:0 18px 40px -32px rgba(26,28,26,0.18);">
          <h1 style="margin:0 0 10px;font-family:${DISPLAY_FONT};font-size:22px;font-weight:600;color:${BRAND.text};letter-spacing:-0.01em;">${title}</h1>
          <div style="color:${BRAND.textMuted};font-size:15px;line-height:1.65;">
            ${bodyHtml}
          </div>
          ${
            button
              ? `
            <div style="text-align:center;margin-top:30px;">
              <a href="${button.href}" style="display:inline-block;background:${BRAND.primaryDeep};color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:24px;font-size:15px;font-weight:600;font-family:${BODY_FONT};">
                ${button.label}
              </a>
              ${button.note ? `<p style="margin-top:14px;font-size:12px;color:${BRAND.sand};line-height:1.5;">${button.note}</p>` : ''}
            </div>`
              : ''
          }
        </div>
        <p style="text-align:center;margin:26px 0 0;font-size:12px;color:#727972;line-height:1.6;">
          MindfulLife &middot; Your daily reflection &amp; wellness companion
        </p>
      </div>
    </body>
  </html>
`;

/**
 * Send a "welcome / verify your email" message on new signup.
 */
export const sendWelcomeEmail = async (to: string, verificationLink: string) => {
  const subject = 'Welcome to MindfulLife — verify your email';
  return sendEmail({
    to,
    subject,
    html: wrapInBrand(
      'Welcome to MindfulLife',
      `<p style="margin:0 0 14px;">Thanks for creating your account. Please confirm your email address to activate it and begin your daily reflection practice.</p>
       <p style="margin:0;">If you didn't sign up for MindfulLife, you can safely ignore this email.</p>`,
      { label: 'Verify email', href: verificationLink, note: 'This link expires in 24 hours.' },
    ),
    text: `Welcome to MindfulLife!\n\nConfirm your email to activate your account:\n${verificationLink}\n\n(This link expires in 24 hours.)`,
  });
};

/**
 * Send a "you just logged in" notification on every successful login.
 */
export const sendLoginNotificationEmail = async (to: string) => {
  const subject = 'New sign-in to your MindfulLife account';
  return sendEmail({
    to,
    subject,
    html: wrapInBrand(
      'New sign-in detected',
      `<p style="margin:0 0 14px;">We noticed your MindfulLife account was just signed in to.</p>
       <p style="margin:0;">If this was you, no action is needed. If you didn't sign in, please reset your password right away to keep your account safe.</p>`,
    ),
    text: `New sign-in to your MindfulLife account.\n\nIf this was you, no action is needed. If you didn't sign in, please reset your password immediately.`,
  });
};

/**
 * Send a "reset your password" email with a one-time reset link.
 */
export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  const subject = 'Reset your MindfulLife password';
  return sendEmail({
    to,
    subject,
    html: wrapInBrand(
      'Reset your password',
      `<p style="margin:0 0 14px;">We received a request to reset your MindfulLife password. Use the button below to choose a new one.</p>
       <p style="margin:0;">If you didn't request this, you can safely ignore this email — your password won't change.</p>`,
      { label: 'Reset password', href: resetLink, note: 'This link is valid for 1 hour and can only be used once.' },
    ),
    text: `Reset your MindfulLife password.\n\nOpen this link to choose a new one:\n${resetLink}\n\n(This link is valid for 1 hour and can only be used once.)`,
  });
};

export default {
  isEmailConfigured,
  getAppUrl,
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendPasswordResetEmail,
};
