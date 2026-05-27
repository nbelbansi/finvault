# FinVault — Banking Simulator for Test Automation Practice

A full-stack financial application built specifically for learning **UI test automation** (target: 1000+ cases) and **API test automation** (target: 500+ cases). Ideal for interview prep and portfolio projects.

## What's included

| Layer | Tech | Purpose |
|-------|------|---------|
| API | Express + Prisma + SQLite | 68 REST endpoints across 10 modules |
| Web | React + Vite | 14 pages with `data-testid` on every interactive element |
| Shared | Zod schemas + test IDs | Single source of truth for validation & selectors |
| API tests | Vitest + Supertest | Example suite with DB isolation |
| E2E tests | Playwright | Example UI flows with auto-start servers |
| Catalog | YAML scenario matrix | Roadmap to 500+ API / 1000+ UI tests |

## Quick start

```bash
cd C:\Users\nkumar\projects\finvault
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

```bash
# API tests (resets test DB automatically)
npm run test:api

# E2E tests (starts API + web automatically)
cd tests/e2e && npx playwright install chromium
npm run test:e2e
```

## How to reach 1000+ UI / 500+ API tests

See [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) and [tests/catalog/scenario-matrix.yaml](tests/catalog/scenario-matrix.yaml).

**API formula:** 68 endpoints × 8 scenario types ≈ **544 tests**

**UI formula:** 14 pages × 10 scenario types × 7 data variants ≈ **980 tests**

## Project structure

```
finvault/
├── apps/api/          # Express REST API
├── apps/web/          # React frontend
├── packages/shared/   # Schemas, constants, testIds
├── tests/api/         # Supertest + Vitest
├── tests/e2e/         # Playwright
├── tests/catalog/     # Scenario matrix
└── docs/              # Testing guide
```

## Interview highlights

- Stable selectors via shared `testIds` package
- Deterministic seed data for parallel test runs
- Role-based access (CUSTOMER / PREMIUM / ADMIN)
- Business rule errors with machine-readable `code` fields
- OpenAPI contract for API documentation and contract testing
