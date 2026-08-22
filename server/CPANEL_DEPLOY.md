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

## PostgreSQL setup in cPanel

Use cPanel's PostgreSQL Database Wizard for the first database and user:

1. Open `Databases` -> `PostgreSQL Database Wizard`.
2. Enter a database name, for example `minder`, and click `Create Database`.
3. Create a PostgreSQL user, for example `minder_user`, with a strong generated password.
4. Submit the final step to add the user to the database.

cPanel may prefix database and user names with your account username. Use the full final names shown by cPanel, for example:

```text
cpaneluser_minder
cpaneluser_minder_user
```

If you are not using the wizard, create the database and user from `Databases` -> `PostgreSQL Databases`, then use `Add User to Database` to attach the user to the database.

Do not create databases or users from phpPgAdmin. Use phpPgAdmin only to inspect or manage data after cPanel has created the database and user.

The PostgreSQL host is usually:

```text
localhost
```

Confirm this with your hosting provider if the app cannot connect. The default PostgreSQL port is:

```text
5432
```

Build the production `DATABASE_URL` like this:

```env
DATABASE_URL="postgresql://cpaneluser_minder_user:YOUR_PASSWORD@localhost:5432/cpaneluser_minder"
```


If the password contains special URL characters, encode them before placing the password in `DATABASE_URL`:

```text
@ -> %40
# -> %23
: -> %3A
/ -> %2F
```

Store `DATABASE_URL` only in the backend cPanel environment. Do not add it to the frontend or Vercel.

## Required environment variables

Set these in cPanel before starting the app:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
CSRF_SECRET=...
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-domain.example
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

Generate `CSRF_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
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
- Auth uses `Authorization: Bearer <jwt>` headers instead of a session cookie, so production login no longer depends on third-party cookie availability. A custom frontend domain is still preferred for trust, branding, and stable CORS configuration.

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
