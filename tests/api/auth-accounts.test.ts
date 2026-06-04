import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiDir = join(__dirname, "../../apps/api");
const envPath = join(apiDir, ".env");

if (existsSync(envPath)) config({ path: envPath });

const dbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const directUrl = process.env.TEST_DIRECT_URL ?? process.env.DIRECT_URL;

if (!dbUrl?.startsWith("postgresql")) {
  throw new Error(
    "Set DATABASE_URL (or TEST_DATABASE_URL) in apps/api/.env to your Neon PostgreSQL URL. See .env.example."
  );
}

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = dbUrl;
if (directUrl) process.env.DIRECT_URL = directUrl;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

let app: typeof import("../../apps/api/src/index.js").app;
let token: string;
let accountId: string;

beforeAll(async () => {
  execSync("npx prisma db push --force-reset", {
    cwd: apiDir,
    stdio: "inherit",
    env: process.env,
  });
  execSync("npx tsx prisma/seed.ts", { cwd: apiDir, stdio: "inherit", env: process.env });
  const mod = await import("../../apps/api/src/index.js");
  app = mod.app;

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "alice@finvault.test", password: "Password123!" });
  token = login.body.token;

  const accounts = await request(app)
    .get("/api/accounts")
    .set("Authorization", `Bearer ${token}`);
  accountId = accounts.body.accounts[0].id;
}, 120000);

describe("Auth API", () => {
  it("POST /auth/login — valid credentials returns token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@finvault.test", password: "Password123!" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("alice@finvault.test");
  });

  it("POST /auth/login — invalid password returns 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@finvault.test", password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("POST /auth/register — duplicate email returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "alice@finvault.test",
        password: "Password123!",
        firstName: "A",
        lastName: "B",
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("EMAIL_EXISTS");
  });

  it("GET /auth/me — requires authentication", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("Accounts API", () => {
  it("GET /accounts — returns user accounts", async () => {
    const res = await request(app)
      .get("/api/accounts")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.accounts.length).toBeGreaterThan(0);
  });

  it("POST /accounts/:id/deposit — increases balance", async () => {
    const before = await request(app)
      .get(`/api/accounts/${accountId}/balance`)
      .set("Authorization", `Bearer ${token}`);
    const res = await request(app)
      .post(`/api/accounts/${accountId}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100 });
    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(before.body.balance + 100);
  });

  it("POST /accounts/:id/withdraw — insufficient funds returns 400", async () => {
    const res = await request(app)
      .post(`/api/accounts/${accountId}/withdraw`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 999999999 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INSUFFICIENT_FUNDS");
  });
});

describe("Transfers API", () => {
  it("POST /transfers — internal transfer between accounts", async () => {
    const accounts = await request(app)
      .get("/api/accounts")
      .set("Authorization", `Bearer ${token}`);
    const [from, to] = accounts.body.accounts;
    const res = await request(app)
      .post("/api/transfers")
      .set("Authorization", `Bearer ${token}`)
      .send({ fromAccountId: from.id, toAccountId: to.id, amount: 50 });
    expect(res.status).toBe(201);
    expect(res.body.transfer.status).toBe("COMPLETED");
  });
});

describe("Admin API", () => {
  it("GET /admin/users — forbidden for customer", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("GET /admin/metrics — allowed for admin", async () => {
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@finvault.test", password: "Admin123!" });
    const res = await request(app)
      .get("/api/admin/metrics")
      .set("Authorization", `Bearer ${adminLogin.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.metrics.totalUsers).toBeGreaterThan(0);
  });
});
