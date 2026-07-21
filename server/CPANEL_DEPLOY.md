# cPanel Backend Deployment

This backend is prepared to run as a cPanel Node.js application with the `server` directory set as the application root.

## Requirements

- cPanel `Application Manager` with Node.js support
- Node.js `18.18.0` or newer
- PostgreSQL database access
- Environment-variable support in the hosting stack

## Application settings

- Application root: `server`
- Application URL: your API domain or subdomain
- Application startup file: `app.js`

`app.js` loads `dist/server.js`, which keeps the Passenger entrypoint aligned with the TypeScript build output.

## Required environment variables

Set these in cPanel before starting the app:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-domain.example
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
TRUST_PROXY=1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CRON_SECRET=replace_with_a_long_random_cron_secret
RUN_DAILY_REMINDER_JOB=false
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:notifications@your-domain.example
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_AVATAR_FOLDER=mindfullife/avatars
```

## Deploy sequence

Run these inside the `server` directory after the code is present on the host:

```bash
npm install
npm run verify:production
npm run build
npx prisma migrate deploy
```

Then restart the Node.js app from cPanel.

## Notes

- `TRUST_PROXY=1` is recommended because cPanel commonly runs Node.js behind Apache/Passenger.
- Leave `RUN_DAILY_REMINDER_JOB=false` when cPanel cron is triggering reminders through the protected HTTP endpoint.
- If your hosting plan does not provide PostgreSQL, use an external PostgreSQL service before deploying this backend.
- Prefer a custom frontend domain such as `app.your-domain.example` instead of relying on the default `*.vercel.app` hostname for production auth. This API uses a secure cookie session, and sibling subdomains are more reliable than cross-site domains.

## cPanel cron job

Create a cPanel cron job that calls the protected reminder endpoint:

```bash
curl -s -X POST https://your-api-domain.example/api/cron/reminders \
  -H "x-cron-secret: replace_with_a_long_random_cron_secret" \
  >> /home/yourusername/logs/reminders.log 2>&1
```

For a once-per-minute schedule, use:

```text
* * * * *
```
