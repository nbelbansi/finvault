# FinVault Testing Guide

This guide explains how to systematically build **500+ API tests** and **1000+ UI tests** using FinVault as your practice application.

## Philosophy

Don't write random tests. Use a **scenario matrix**:

```
Total tests = modules × endpoints/pages × scenario types × data variants
```

FinVault is designed so every dimension is explicit — endpoints, validation rules, roles, and UI test IDs.

---

## Part 1: API Testing (500+ tests)

### Stack

- **Vitest** — test runner
- **Supertest** — HTTP assertions against Express app
- **Neon test database** — `prisma db push --force-reset` + re-seed before suite (use `TEST_DATABASE_URL` on a separate Neon branch)

### Scenario types (apply to EVERY endpoint)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Happy path | 200/201 + correct body |
| 2 | No auth token | 401 |
| 3 | Invalid token | 401 |
| 4 | Wrong role | 403 |
| 5 | Missing required fields | 400 + VALIDATION_ERROR |
| 6 | Invalid format/range | 400 |
| 7 | Resource not found | 404 |
| 8 | Business rule violation | 400 + specific code |

**68 endpoints × 8 types = 544 API tests**

### Example structure

```
tests/api/
├── auth.test.ts           # 8 endpoints × 8 scenarios = 64 tests
├── accounts.test.ts       # 10 × 8 = 80
├── transfers.test.ts      # 5 × 8 = 40
├── payees-bills.test.ts   # 8 × 8 = 64
├── cards.test.ts          # 7 × 8 = 56
├── budgets.test.ts        # 6 × 8 = 48
├── investments.test.ts    # 9 × 8 = 72
├── loans.test.ts          # 6 × 8 = 48
├── notifications.test.ts  # 4 × 8 = 32
└── admin.test.ts          # 5 × 8 = 40
```

### Helper pattern

```typescript
async function authAs(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token;
}

function authed(token: string) {
  return { Authorization: `Bearer ${token}` };
}
```

### Business rule codes to test

| Code | Trigger |
|------|---------|
| INSUFFICIENT_FUNDS | Withdraw/transfer/bill pay over balance |
| EMAIL_EXISTS | Duplicate registration |
| VALIDATION_ERROR | Zod schema failure |
| FORBIDDEN | Customer accessing admin |
| NOT_FOUND | Invalid UUID resource |

---

## Part 2: UI Testing (1000+ tests)

### Stack

- **Playwright** — browser automation
- **data-testid** — from `@finvault/shared` package

### Pages (14)

login, register, forgot-password, dashboard, accounts, transfers, payees, cards, budgets, investments, loans, notifications, settings, admin

### Scenario types (apply per page)

| # | Type | Example |
|---|------|---------|
| 1 | Page render | All key elements visible |
| 2 | Form — valid submit | Success toast/navigation |
| 3 | Form — invalid submit | Error messages shown |
| 4 | Navigation | Sidebar routes work |
| 5 | Empty state | New user with no accounts |
| 6 | Loading state | Spinner during API call |
| 7 | Error state | Mock 500, show error |
| 8 | Role-based UI | Admin link hidden for customer |
| 9 | Responsive | Mobile viewport layout |
| 10 | Accessibility | Tab order, labels |

**14 pages × 10 types × 7 variants ≈ 980 tests**

### Selector convention

Always use shared test IDs:

```typescript
import { testIds } from "@finvault/shared";

await page.getByTestId(testIds.loginEmail).fill("alice@finvault.test");
```

Never use CSS classes or XPath for core flows — interviewers look for stable selector strategy.

### Data variants

Test with all three seed users:

- **Alice** (CUSTOMER) — standard daily limits
- **Bob** (PREMIUM) — higher transfer limits  
- **Admin** — admin panel access

Boundary amounts: `0.01`, `0`, `-1`, `10000.01`, `999999999`

---

## Part 3: Learning path (4-week plan)

### Week 1 — Foundation (50 API + 50 UI)
- Run example tests
- Write all Auth API scenarios
- Write Login + Dashboard E2E

### Week 2 — Core banking (150 API + 200 UI)
- Accounts + Transfers full coverage
- Form validation UI tests

### Week 3 — Extended features (200 API + 400 UI)
- Payees, Cards, Budgets, Investments, Loans
- Role-based and responsive tests

### Week 4 — Advanced (100+ API + 350+ UI)
- Admin module
- Accessibility suite
- Parallel execution + CI pipeline

---

## Part 4: Interview talking points

1. **Test pyramid** — many API tests, fewer E2E, unit tests for pure logic
2. **Deterministic data** — seed script, no flaky random data
3. **Page Object Model** — wrap testIds in page classes for Playwright
4. **Contract testing** — OpenAPI spec at `/api/docs`
5. **CI integration** — GitHub Actions running `test:api` + `test:e2e`
6. **Coverage metrics** — map tests to scenario-matrix.yaml, not just line coverage

---

## Part 5: Page Object example

```typescript
// tests/e2e/pages/LoginPage.ts
import { Page } from "@playwright/test";
import { testIds } from "@finvault/shared";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto("/login"); }

  async login(email: string, password: string) {
    await this.page.getByTestId(testIds.loginEmail).fill(email);
    await this.page.getByTestId(testIds.loginPassword).fill(password);
    await this.page.getByTestId(testIds.loginSubmit).click();
  }
}
```

---

## Quick reference

| Command | Action |
|---------|--------|
| `npm run dev` | Start API + Web |
| `npm run db:seed` | Reset demo data |
| `npm run test:api` | Run API tests |
| `npm run test:e2e` | Run Playwright |

See `tests/catalog/scenario-matrix.yaml` for the full module breakdown.
