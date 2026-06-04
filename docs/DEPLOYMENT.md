# Deploy FinVault to Netlify + Neon

FinVault has **no local database**. All environments use [Neon](https://neon.tech) PostgreSQL.

## Prerequisites

- Neon account and project
- Netlify account
- Git repository (GitHub, GitLab, or Bitbucket)

## 1. Neon setup

1. Create a project at [console.neon.tech](https://console.neon.tech)
2. Open **Connection details**
3. Copy strings:
   - **Pooled connection** → `DATABASE_URL` (used by the app at runtime)
   - **Direct connection** → `DIRECT_URL` (used by Prisma `db push` / migrations)

Optional but recommended for tests:

- Create a **branch** named `test` in Neon
- Use that branch’s pooled/direct URLs as `TEST_DATABASE_URL` and `TEST_DIRECT_URL` in local `.env`

## 2. Local development

```bash
cp apps/api/.env.example apps/api/.env
# Paste Neon URLs and set JWT_SECRET

npm install
npm run db:push
npm run db:seed
npm run dev
```

## 3. Netlify site

1. **Add new site** → Import your Git repository
2. Build settings are read from `netlify.toml`:
   - **Build command:** `npm run netlify:build`
   - **Publish directory:** `apps/web/dist`
   - **Functions:** `apps/api/netlify/functions`
   - **Node:** 20 (`NODE_VERSION` + `AWS_LAMBDA_JS_RUNTIME=nodejs20.x` for Prisma)

## 4. Netlify environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon **pooled** connection string |
| `DIRECT_URL` | Yes | Neon **direct** connection string |
| `JWT_SECRET` | Yes | Long random secret for production |
| `CORS_ORIGINS` | Yes | `https://your-site.netlify.app` (and preview URLs if needed) |
| `NODE_VERSION` | No | Set to `20` if not using `netlify.toml` default |

Do **not** commit `.env` files. Configure variables in **Site settings → Environment variables** only.

If your build log shows `Environment variables loaded from .env`, remove `apps/api/.env` from the repo (it is gitignored locally but must not be committed).

## 5. First deploy

1. Trigger deploy — Netlify runs `prisma db push` against Neon during build
2. Seed demo data once from your machine (uses production Neon URL):

```bash
# With production DATABASE_URL/DIRECT_URL in apps/api/.env
npm run db:seed
```

Or run seed in Netlify’s **Functions** shell / a one-off CI job with the same env vars.

## 6. Verify

- Open `https://your-site.netlify.app`
- Login: `alice@finvault.test` / `Password123!`
- Health: `https://your-site.netlify.app/api/health` (proxied to serverless function)
- Docs: `https://your-site.netlify.app/api/docs`

## 7. API routing

Netlify redirects `/api/*` to the `api` serverless function. The React app calls `/api/...` on the same origin — no CORS issues in production when `CORS_ORIGINS` includes your Netlify URL.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Prisma engine error on Netlify | Ensure `binaryTargets` includes `rhel-openssl-3.0.x` in `schema.prisma` |
| 500 on `/api/*` | Check Netlify function logs; verify `DATABASE_URL` uses **pooled** URL |
| `db push` fails in build | Set `DIRECT_URL`; confirm Neon allows connections from Netlify build IPs |
| CORS errors | Add exact site URL to `CORS_ORIGINS` |
| Empty login | Run `npm run db:seed` against the same Neon database |

## Running tests against Neon

```bash
# apps/api/.env must contain DATABASE_URL (postgresql://...)
npm run test:api
```

Tests run `prisma db push --force-reset` and re-seed — use a dedicated Neon **test branch**, not production.
