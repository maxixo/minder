# Vercel Frontend Deployment

This frontend is prepared to deploy as a Vite application on Vercel.

## Vercel project settings

- Framework preset: `Vite`
- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`

The backend should stay on cPanel. Point the Vercel project at the `client` directory only.

## Required environment variables

Set these in the Vercel project:

```env
VITE_API_URL=https://api.your-domain.example
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

`VITE_API_URL` can be set with or without a trailing `/api`; the client normalizes both forms.

## Domain and CSP guidance

Use a custom frontend domain such as `https://app.your-domain.example` and keep the API on `https://api.your-domain.example`.

This project uses `Authorization: Bearer <jwt>` API authentication instead of a browser-managed session cookie, so login persistence does not depend on third-party cookie support.

`client/vercel.json` keeps a strict Content Security Policy while allowing HTTPS API calls, so the frontend no longer hardcodes one backend hostname.

## Matching backend settings

Set the backend `CLIENT_URL` env var on cPanel to the frontend origin:

```env
CLIENT_URL=https://app.your-domain.example
```

If you need multiple allowed frontend origins, provide a comma-separated list:

```env
CLIENT_URL=https://app.your-domain.example,https://staging-app.your-domain.example
```

The backend normalizes these origins, so accidental trailing slashes will not break CORS or CSRF checks.

## Verification

After deployment:

1. Open the Vercel site over HTTPS.
2. Confirm registration and login work against the cPanel API.
3. Confirm authenticated refreshes still work.
4. Confirm `/api` requests reach the cPanel backend without CORS failures.
5. Confirm push notification enrollment still works after setting `VITE_VAPID_PUBLIC_KEY`.
