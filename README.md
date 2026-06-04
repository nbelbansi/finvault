# FinVault — Banking Simulator for Test Automation Practice

A full-stack **finance domain** application built for **1000+ UI tests** and **500+ API tests**. Uses **Neon PostgreSQL** (cloud only — no local database) and deploys to **Netlify** (React SPA + serverless API).

## Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| Database | **Neon PostgreSQL** | Serverless Postgres via Prisma |
| API | Express + Prisma + Netlify Functions | 68 REST endpoints across 10 modules |
| Web | React + Vite | 14 pages with `data-testid` on interactive elements |
| Deploy | **Netlify** | Static frontend + `/api` serverless function |
| Shared | Zod schemas + test IDs | Validation & stable selectors |
| API tests | Vitest + Supertest | Example suite (Neon test branch recommended) |
| E2E tests | Playwright | Example UI flows |
| Catalog | YAML scenario matrix | Roadmap to 500+ API / 1000+ UI tests |

## Quick start (Neon required)

### 1. Create a Neon project

1. Sign up at [neon.tech](https://neon.tech)
2. Create a project and database
3. Copy **Pooled connection** → `DATABASE_URL`
4. Copy **Direct connection** → `DIRECT_URL`

### 2. Configure environment

```bash
cd d:\react-project\finvault
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your Neon URLs and JWT_SECRET
```

### 3. Install, migrate, seed

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

- **Web:** http://localhost:5173  
- **API:** http://localhost:4000  
- **Swagger:** http://localhost:4000/api/docs  

## Seed users

| Email | Password | Role |
|-------|----------|------|
| alice@finvault.test | Password123! | CUSTOMER |
| bob@finvault.test | Password123! | PREMIUM |
| admin@finvault.test | Admin123! | ADMIN |

## Modules (test surface area)

1. **Auth** — register, login, logout, refresh, forgot/reset password, profile
2. **Accounts** — CRUD, deposit, withdraw, close, transactions, balance
3. **Transfers** — internal, external, scheduled, cancel
4. **Payees & Bills** — payee CRUD, bill pay, schedule, history
5. **Cards** — issue, freeze/unfreeze, limits, transactions
6. **Budgets** — create, spending tracking, alerts
7. **Investments** — portfolios, orders, watchlist
8. **Loans** — apply, payments, amortization, prepay
9. **Notifications** — list, mark read, delete
10. **Admin** — users, audit logs, metrics, maintenance

## Running tests

API tests reset and re-seed the database configured in `apps/api/.env`. Use a **separate Neon branch** for `TEST_DATABASE_URL` when possible.

```bash
# API tests (requires Neon URL in apps/api/.env)
npm run test:api

# E2E tests (starts API + web locally; API still uses Neon)
cd tests/e2e && npx playwright install chromium
npm run test:e2e
```

## Deploy to Netlify

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for step-by-step Netlify + Neon setup.

Summary:

1. Push repo to GitHub
2. Connect site in Netlify (build command and publish dir are in `netlify.toml`)
3. Set environment variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGINS`
4. Deploy, then run `npm run db:seed` once against production Neon (or use a Neon branch)

## How to reach 1000+ UI / 500+ API tests

See [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) and [tests/catalog/scenario-matrix.yaml](tests/catalog/scenario-matrix.yaml).

**API formula:** 68 endpoints × 8 scenario types ≈ **544 tests**

**UI formula:** 14 pages × 10 scenario types × 7 data variants ≈ **980 tests**

## Project structure

```
finvault/
├── apps/api/              # Express REST API + Netlify function
│   ├── netlify/functions/ # Serverless handler for /api/*
│   └── prisma/            # PostgreSQL schema (Neon)
├── apps/web/              # React frontend
├── packages/shared/       # Schemas, constants, testIds
├── tests/api/             # Supertest + Vitest
├── tests/e2e/             # Playwright
├── tests/catalog/         # Scenario matrix
├── netlify.toml           # Netlify build & redirects
└── docs/                  # Deployment & testing guides
```

## Interview highlights

- Stable selectors via shared `testIds` package
- Deterministic seed data for parallel test runs
- Role-based access (CUSTOMER / PREMIUM / ADMIN)
- Business rule errors with machine-readable `code` fields
- OpenAPI contract for API documentation and contract testing
- Cloud-native: Neon + Netlify (no local SQLite)
