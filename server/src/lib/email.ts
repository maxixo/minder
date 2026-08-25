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

const wrapInBrand = (title: string, bodyHtml: string, button?: { label: string; href: string; note?: string }) => `
  <!DOCTYPE html>
  <html lang="en">
    <body style="margin:0;padding:0;background:#f6f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="max-width:480px;margin:0 auto;padding:32px 20px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:18px;font-weight:700;color:#111827;">Mindful</span>
        </div>
        <div style="background:#ffffff;border-radius:12px;padding:32px 28px;border:1px solid #e5e7eb;">
          <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">${title}</h1>
          <div style="color:#4b5563;font-size:15px;line-height:1.6;">
            ${bodyHtml}
          </div>
          ${
            button
              ? `
            <div style="text-align:center;margin-top:28px;">
              <a href="${button.href}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;">${button.label}</a>
              ${button.note ? `<p style="margin-top:12px;font-size:12px;color:#9ca3af;">${button.note}</p>` : ''}
            </div>`
              : ''
          }
        </div>
        <p style="text-align:center;margin-top:24px;font-size:12px;color:#9ca3af;">
          Mindful &middot; Your daily reflection &amp; wellness companion
        </p>
      </div>
    </body>
  </html>
`;

/**
 * Send a "welcome / verify your email" message on new signup.
 */
export const sendWelcomeEmail = async (to: string, verificationLink: string) => {
  const subject = 'Welcome to Mindful — verify your email';
  return sendEmail({
    to,
    subject,
    html: wrapInBrand(
      'Welcome to Mindful!',
      `<p>Thanks for creating an account. Please confirm your email address to activate it and start tracking your daily reflections.</p>`,
      { label: 'Verify email', href: verificationLink, note: 'This link expires in 24 hours.' },
    ),
    text: `Welcome to Mindful!\n\nConfirm your email to activate your account:\n${verificationLink}\n\n(This link expires in 24 hours.)`,
  });
};

/**
 * Send a "you just logged in" notification on every successful login.
 */
export const sendLoginNotificationEmail = async (to: string) => {
  const subject = 'New sign-in to your Mindful account';
  return sendEmail({
    to,
    subject,
    html: wrapInBrand(
      'New sign-in detected',
      `<p>This is a notification that your Mindful account was just signed in to.</p><p>If this was you, no action is needed. If you didn't sign in, please reset your password right away.</p>`,
    ),
    text: `New sign-in to your Mindful account.\n\nIf this was you, no action is needed. If you didn't sign in, please reset your password immediately.`,
  });
};

/**
 * Send a "reset your password" email with a one-time reset link.
 */
export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  const subject = 'Reset your Mindful password';
  return sendEmail({
    to,
    subject,
    html: wrapInBrand(
      'Reset your password',
      `<p>We received a request to reset your password. Use the button below to choose a new one.</p>`,
      { label: 'Reset password', href: resetLink, note: 'This link is valid for 1 hour and can only be used once.' },
    ),
    text: `Reset your Mindful password.\n\nOpen this link to choose a new one:\n${resetLink}\n\n(This link is valid for 1 hour and can only be used once.)`,
  });
};

export default {
  isEmailConfigured,
  getAppUrl,
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendPasswordResetEmail,
};
