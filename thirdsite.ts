/**
 * Third-Site Auth Migration Notes
 *
 * Change summary
 * - Authentication no longer depends on the browser sending an HTTP-only JWT
 *   session cookie to the API domain.
 * - Login now returns the signed JWT in the JSON response body.
 * - The frontend stores that JWT under the sessionStorage key
 *   `mindful_auth_token`.
 * - Every API request made through the shared Axios client now sends the JWT
 *   as `Authorization: Bearer <token>`.
 * - Protected Express routes now read and verify only the bearer token from
 *   `req.headers.authorization`.
 * - Cookie-specific auth helpers, cookie options, and deployment env guidance
 *   were removed from the active server/client path.
 *
 * Why this was needed
 * - The frontend is hosted on Vercel while the backend is hosted on a separate
 *   API domain.
 * - Browser-managed cookies on that deployment shape can be treated as
 *   third-party cookies.
 * - Third-party cookies are increasingly blocked or partitioned by browsers,
 *   which makes a cookie-only session unreliable even when SameSite=None and
 *   Secure are configured correctly.
 * - Authorization headers are explicitly set by the app's JavaScript, so they
 *   are not blocked by third-party cookie policy.
 *
 * Server implementation
 *
 * server/src/middleware/auth.ts
 * - `getTokenFromAuthorizationHeader(authorizationHeader)`
 *   Purpose:
 *   Parses the Express `authorization` header and returns the token only when
 *   the header uses the Bearer scheme.
 *   Inputs:
 *   `string | string[] | undefined`.
 *   Output:
 *   A token string, or `null` when the header is missing, malformed, or uses a
 *   different auth scheme.
 *   Usage:
 *   `getTokenFromAuthorizationHeader(req.headers.authorization)`.
 *
 * - `protect(req, res, next)`
 *   Purpose:
 *   Protects authenticated routes by verifying the bearer JWT with
 *   `JWT_SECRET`, loading the matching user from Prisma, serializing that user,
 *   and assigning it to `req.user`.
 *   Error cases:
 *   Missing, malformed, expired, invalid, or userless tokens return
 *   `401 { success: false, message: "Not authorized" }`, except a valid token
 *   for a deleted user returns `401` with `User not found`.
 *   Side effects:
 *   Reads PostgreSQL through Prisma and sets `req.user` for downstream
 *   controllers.
 *
 * - `generateToken(id)`
 *   Purpose:
 *   Creates the JWT used by the bearer flow.
 *   Inputs:
 *   A user id string.
 *   Output:
 *   A JWT signed with `JWT_SECRET` and expiring according to
 *   `JWT_EXPIRES_IN`, defaulting to seven days.
 *
 * server/src/controllers/authController.ts
 * - `login`
 *   After validating credentials, it returns:
 *   `{ success: true, data: { user, token } }`.
 *   It no longer calls `res.cookie`.
 *
 * - `register`
 *   Preserves the current product behavior: registration creates the account
 *   and tells the user to log in. It does not create a browser session.
 *
 * - `logout`
 *   Remains as a server endpoint for API consistency, but JWT logout is now
 *   effectively client-side token removal because the access token is
 *   stateless. Server-side revocation would require a denylist, token version,
 *   or refresh-token persistence layer.
 *
 * server/src/server.ts
 * - CORS no longer enables credentialed cookie mode.
 * - `CLIENT_URL` remains required because CORS and trusted-origin checks still
 *   restrict which frontend origins can call mutating API routes.
 *
 * Client implementation
 *
 * client/src/services/api.ts
 * - `AUTH_TOKEN_STORAGE_KEY`
 *   The browser storage key used for the JWT: `mindful_auth_token`.
 *
 * - `getAuthToken()`
 *   Reads the JWT from sessionStorage when running in a browser. If an older
 *   build left a JWT in localStorage, it migrates that token into
 *   sessionStorage and removes the persistent localStorage copy.
 *
 * - `setAuthToken(token)`
 *   Stores the JWT returned by login in sessionStorage and clears any legacy
 *   localStorage value.
 *
 * - `clearAuthToken()`
 *   Removes the JWT from both sessionStorage and localStorage during logout or
 *   after a 401 response.
 *
 * - Axios request interceptor
 *   Reads the current JWT and adds:
 *   `Authorization: Bearer <token>`.
 *   It still adds `x-csrf-token` for mutating requests, using the existing
 *   stateless CSRF token endpoint.
 *
 * - Axios response interceptor
 *   Clears the stored JWT when `/auth/me` fails with 401 or when any protected
 *   non-auth request fails with 401. For protected requests, it redirects the
 *   browser to `/login`.
 *
 * client/src/services/authService.ts
 * - `login(data)`
 *   Calls `/auth/login`, reads `res.data.data.token`, stores it through
 *   `setAuthToken`, and returns the existing response shape to the React auth
 *   context.
 *
 * - `logout()`
 *   Calls `/auth/logout` as a best-effort request and always clears the local
 *   JWT in a `finally` block.
 *
 * Deployment changes
 * - `COOKIE_SAME_SITE` and `COOKIE_SECURE` were removed from
 *   `server/.env.example` because auth no longer uses cookies.
 * - `server/CPANEL_DEPLOY.md` now documents bearer auth and keeps
 *   `CSRF_SECRET` as a required secret.
 * - `server/scripts/check-production-env.mjs` no longer warns about cookie
 *   SameSite/Secure settings.
 * - `client/vercel.json` now sends a strict Content Security Policy and
 *   browser security headers for the deployed Vercel frontend.
 * - `server/src/server.ts` now configures Helmet with an API-specific CSP that
 *   denies scripts, styles, frames, objects, forms, fonts, and images by
 *   default for API responses.
 *
 * XSS hardening protocols implemented
 * - Frontend CSP:
 *   The Vercel app sends `script-src 'self'` and `script-src-attr 'none'`.
 *   This blocks injected inline scripts and inline event-handler attributes
 *   such as `onclick`.
 *
 * - Framing protection:
 *   The frontend sends `frame-ancestors 'none'`, `frame-src 'none'`, and
 *   `X-Frame-Options: DENY`. The API sends `frame-ancestors 'none'` through
 *   Helmet. This prevents clickjacking and frame-based script interaction.
 *
 * - Object/plugin blocking:
 *   `object-src 'none'` prevents legacy plugin/embed execution paths.
 *
 * - Base URI locking:
 *   `base-uri 'self'` on the frontend and `base-uri 'none'` on API responses
 *   prevent attackers from changing relative URL resolution with an injected
 *   `<base>` tag.
 *
 * - Strict connection policy:
 *   Frontend `connect-src` is limited to the app itself and the production API
 *   domain. This helps prevent injected scripts from exfiltrating data to
 *   arbitrary HTTPS endpoints through `fetch` or XHR. If the deployed VPS API
 *   domain changes, `client/vercel.json` must be updated to include the new API
 *   origin.
 *
 * - Referrer minimization:
 *   `Referrer-Policy: no-referrer` avoids leaking route or query data to
 *   external resources.
 *
 * - Permissions Policy:
 *   Camera, microphone, geolocation, payment, USB, and display capture are
 *   denied unless explicitly needed later.
 *
 * - MIME sniffing protection:
 *   `X-Content-Type-Options: nosniff` prevents browsers from treating a
 *   mislabeled response as executable script or style.
 *
 * - Session-scoped token storage:
 *   Bearer tokens are stored in sessionStorage rather than localStorage. This
 *   keeps refresh behavior working inside the tab but avoids persistent token
 *   storage across browser restarts.
 *
 * Security tradeoffs
 * - Bearer tokens fix the third-party-cookie blocking problem because the app
 *   sends the JWT explicitly in an Authorization header.
 * - Storing a JWT in browser-accessible storage means XSS can still steal the
 *   token during an active session. The new CSP, absence of unsafe HTML sinks,
 *   React escaping, and stricter headers reduce the chance of script execution,
 *   but they do not replace continued XSS discipline.
 * - CSRF risk is reduced for bearer auth because browsers do not attach
 *   Authorization headers automatically to attacker-created forms or image
 *   requests. The existing stateless CSRF middleware is still kept for
 *   mutating API calls as a defense-in-depth origin/request integrity check.
 * - Stateless JWT logout cannot invalidate an already-issued token by itself.
 *   To force logout across devices or immediately revoke compromised tokens,
 *   add server-side revocation such as a token version column, denylist table,
 *   short-lived access tokens plus refresh tokens, or a session table.
 */
export {};
