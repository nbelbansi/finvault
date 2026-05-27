import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test("valid login redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("alice@finvault.test");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("dashboard-welcome")).toBeVisible();
    await expect(page.getByTestId("dashboard-total-balance")).toContainText("$");
  });

  test("invalid login shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("alice@finvault.test");
    await page.getByTestId("login-password").fill("wrongpassword");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-error")).toBeVisible();
  });
});

test.describe("Accounts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("alice@finvault.test");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await page.getByTestId("nav-accounts").click();
  });

  test("accounts list is visible", async ({ page }) => {
    await expect(page.getByTestId("accounts-list")).toBeVisible();
  });

  test("deposit updates balance toast", async ({ page }) => {
    await page.getByRole("button", { name: "Manage" }).first().click();
    await page.getByTestId("deposit-amount").fill("25");
    await page.getByTestId("deposit-submit").click();
    await expect(page.getByTestId("toast-message")).toContainText("Deposit");
  });
});

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("alice@finvault.test");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
  });

  test("can navigate to all main sections", async ({ page }) => {
    const sections = [
      "nav-transfers", "nav-payees", "nav-cards", "nav-budgets",
      "nav-investments", "nav-loans", "nav-notifications", "nav-settings",
    ];
    for (const id of sections) {
      await page.getByTestId(id).click();
      await expect(page.locator("h1.page-title")).toBeVisible();
    }
  });
});
