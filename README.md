# Mindful — Daily Reflection & Wellness Tracker

A full-stack daily reflection, mood, and wellness-tracking web app. Log entries, track analytics and insights, receive daily reminders, save inspirational quotes, and explore guided self-care content.

**Monorepo layout**

| Package | Description | Stack |
|---------|-------------|-------|
| `server` | REST API | Node.js, Express, Prisma, PostgreSQL |
| `client` | Web app (PWA) | React 18, Vite, TypeScript, Tailwind CSS |

---

## ✨ Features

- **Daily reflection** — log mood/entry each day, review past entries, and get reflection insights.
- **Analytics & insights** — heatmaps, streaks, sentiment trends, and personalized insights generated from your entries.
- **Inspiration** — daily inspirational quotes with favorites and push notifications.
- **Emotional guidance & self-care** — guided packs and review summaries.
- **Reminders** — daily reflection and inspiration push reminders (Web Push / VAPID).
- **Auth** — email/password registration & login, plus Google sign-in (GIS ID-token flow), JWT bearer auth, CSRF protection.
- **Billing** — subscription checkout / portal hooks (provider-backed).
- **PWA** — installable, offline-capable, background reminders.

---

## 🧰 Tech Stack

### Server (`server/`)
- **Runtime:** Node.js 20+, Express 4
- **Database:** PostgreSQL with **Prisma ORM** (`@prisma/client` v6)
- **Auth:** `jsonwebtoken` (JWT bearer), `bcryptjs` (password hashing), `google-auth-library`
- **Security:** `helmet`, `cors`, `express-rate-limit`, CSRF middleware, trusted-origin checks
- **Notifications:** `web-push` (VAPID)
- **Tests:** Node's built-in test runner (`node:test`) via `tsx`

### Client (`client/`)
- **Framework:** React 18 + TypeScript
- **Build tool:** Vite 5 (+ `vite-plugin-pwa` for the PWA)
- **Styling:** Tailwind CSS, `framer-motion`
- **Data:** `axios` (shared API client with CSRF + bearer-token handling), `react-router-dom`
- **Charts:** `recharts`
- **Tests:** Vitest

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (npm workspaces used)
- PostgreSQL database (local or hosted)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment

**Server** — copy the example and fill in real values:
```bash
cp server/.env.example server/.env
```
Key variables (see [Environment variables](#-environment-variables) for the full list):
```
DATABASE_URL=postgresql://db_user:db_password@127.0.0.1:5432/mindfullife
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_characters
CSRF_SECRET=replace_with_a_long_random_csrf_secret_at_least_32_bytes
CLIENT_URL=http://localhost:5173
```

**Client** — copy the example:
```bash
cp client/.env.example client/.env
```
```
VITE_API_URL=/api     # Vite proxies /api to the backend in dev
VITE_VAPID_PUBLIC_KEY=your_local_or_production_vapid_public_key
```

### 3. Set up the database
```bash
# From the repo root, generate the Prisma client and create the schema
npm run prisma:generate --workspace server
npm run prisma:migrate --workspace server
```

### 4. Generate VAPID keys (for push reminders)
```bash
npm run vapid:generate
```
Copy the generated public/private key into `server/.env` (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) and the public key into `client/.env` (`VITE_VAPID_PUBLIC_KEY`).

### 5. Run in development
```bash
npm run dev
```
- Client: <http://localhost:5173>
- Server: <http://localhost:4000> (see `PORT` in `server/.env`)

---

## 📜 Scripts (root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Run client + server concurrently |
| `npm run build` | Build server (prisma generate + tsc) then client |
| `npm run typecheck` | Type-check server and client |
| `npm run test` | Run server tests, then client tests |
| `npm run lint` | Lint the client |
| `npm run vapid:generate` | Generate Web Push (VAPID) key pair |

Run workspace-specific scripts with `--workspace server` or `--workspace client` (e.g. `npm run prisma:deploy --workspace server`).

---

## 🔑 Environment Variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `4000`) |
| `NODE_ENV` | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `CSRF_SECRET` | CSRF signing secret (min 32 bytes) |
| `CRON_SECRET` | Shared secret for internal cron endpoints |
| `CLIENT_URL` | Comma-separated allowed client origins |
| `COOKIE_SAME_SITE` / `COOKIE_SECURE` | Cookie policy |
| `TRUST_PROXY` | Trust proxy setting for production |
| `RATE_LIMIT_*` / `REQUEST_TIMEOUT_MS` / `KEEP_ALIVE_TIMEOUT_MS` | Server tuning |
| `RUN_DAILY_REMINDER_JOB` | `true`/`false` — start the daily reminder job |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push credentials |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` / `AVATAR_FOLDER` | Avatar image storage (Cloudinary) |
| `AI_INSIGHTS_ENABLED` | Toggle AI-assisted insights |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in |
| `PREMIUM_*` / `BILLING_*` | Billing provider URLs |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL. Use `/api` in dev (Vite proxy) or an absolute URL in production. |
| `VITE_VAPID_PUBLIC_KEY` | Web Push public key |

---

## 🗄️ Data Model (Prisma)

Core models in `server/prisma/schema.prisma`:

- **User** — account, profile, preferences, timezone, reminder settings
- **Entry** — daily reflection logs
- **EntryInsight** — generated insights attached to entries
- **PushSubscription** — Web Push subscriptions for notifications
- **SavedInspirationQuote** — user-saved inspirational quotes

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** (never stored in plaintext).
- Auth uses a **JWT bearer token** returned in the login response (stored client-side), not HTTP-only cookies (see `thirdsite.ts` for the migration rationale).
- **CSRF protection** is enforced on mutating requests; a trusted-origin middleware rejects requests from unknown origins.
- Helmet + CORS + rate limiting harden the HTTP layer.
- Never commit real `.env` files — only `.env.example` is tracked.

---

## 🧪 Testing

Server tests use Node's built-in test runner (`node:test` + `tsx`), client tests use **Vitest**:

```bash
# everything
npm test

# just the server
npm run test --workspace server

# just the client
npm run test --workspace client -- --run
```

---

## ✅ CI / CD

GitHub Actions runs on push to `main` and on pull requests (`.github/workflows/ci.yml`):

1. Install dependencies (`npm ci`)
2. Generate the Prisma client
3. Lint
4. Type-check (server + client)
5. Run tests (server + client)
6. Build (server + client)

The frontend is deployed to **Vercel** (see `vercel.json`). The backend can be deployed to any Node/Postgres host.

---

## 📁 Project Structure

```
.
├── client/                 # React + Vite web app (PWA)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages (Login, Register, Review, Analytics, …)
│   │   ├── services/       # API client, auth token handling
│   │   ├── lib/            # Domain logic + helpers
│   │   ├── contexts/       # React contexts
│   │   └── hooks/          # Custom hooks
│   └── vercel.json
├── server/                 # Express REST API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # Route definitions
│   │   ├── services/       # Business logic (insights, inspiration, push)
│   │   ├── middleware/     # Auth, CSRF, error handling, validators
│   │   ├── lib/            # Prisma, password, cloudinary, serializers
│   │   ├── config/         # Runtime/env config
│   │   └── jobs/           # Background jobs (daily reminder)
│   ├── prisma/             # Schema + migrations
│   └── test/               # Server tests
├── .github/workflows/      # CI pipeline
├── vercel.json             # Frontend deployment config
└── thirdsite.ts            # Auth migration notes (third-site/cross-origin)
```

---

## 🤝 Contributing

1. Branch off `main` (`git checkout -b feat/your-change`).
2. Make changes and ensure `npm run typecheck` and `npm run test` pass.
3. Push and open a pull request — CI runs automatically.

---

## 📄 License

Private project. All rights reserved.
