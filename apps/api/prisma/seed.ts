import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_USERS } from "@finvault/shared";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.loanPayment.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.transfer.deleteMany(),
    prisma.billPayment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.holding.deleteMany(),
    prisma.watchlistItem.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.card.deleteMany(),
    prisma.budget.deleteMany(),
    prisma.payee.deleteMany(),
    prisma.account.deleteMany(),
    prisma.portfolio.deleteMany(),
    prisma.loan.deleteMany(),
    prisma.passwordReset.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const alice = await prisma.user.create({
    data: {
      email: SEED_USERS.alice.email,
      passwordHash: await hash(SEED_USERS.alice.password),
      firstName: "Alice",
      lastName: "Customer",
      role: "CUSTOMER",
      phone: "+12025550101",
      preferences: JSON.stringify({ theme: "light", currency: "USD" }),
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: SEED_USERS.bob.email,
      passwordHash: await hash(SEED_USERS.bob.password),
      firstName: "Bob",
      lastName: "Premium",
      role: "PREMIUM",
      preferences: JSON.stringify({ theme: "dark", currency: "USD" }),
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: SEED_USERS.admin.email,
      passwordHash: await hash(SEED_USERS.admin.password),
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });

  const checking = await prisma.account.create({
    data: { userId: alice.id, name: "Primary Checking", type: "CHECKING", balance: 12500.5 },
  });
  const savings = await prisma.account.create({
    data: { userId: alice.id, name: "Emergency Savings", type: "SAVINGS", balance: 45000 },
  });

  await prisma.transaction.createMany({
    data: [
      { accountId: checking.id, type: "DEPOSIT", amount: 5000, balanceAfter: 5000, memo: "Payroll" },
      { accountId: checking.id, type: "WITHDRAWAL", amount: -150, balanceAfter: 4850, memo: "Utilities" },
    ],
  });

  const payee = await prisma.payee.create({
    data: {
      userId: alice.id,
      name: "Electric Company",
      nickname: "Electric",
      accountNumber: "1234567890",
      routingNumber: "021000021",
    },
  });

  await prisma.card.create({
    data: { userId: alice.id, lastFour: "4242", brand: "VISA", linkedAccountId: checking.id },
  });

  await prisma.budget.createMany({
    data: [
      { userId: alice.id, name: "Groceries", category: "Food", monthlyLimit: 600, spent: 320 },
      { userId: alice.id, name: "Entertainment", category: "Leisure", monthlyLimit: 200, spent: 85 },
    ],
  });

  const portfolio = await prisma.portfolio.create({
    data: { userId: alice.id, name: "Retirement" },
  });
  await prisma.holding.create({
    data: { portfolioId: portfolio.id, symbol: "AAPL", quantity: 10, avgCost: 175 },
  });
  await prisma.watchlistItem.createMany({
    data: [
      { userId: alice.id, symbol: "MSFT" },
      { userId: alice.id, symbol: "GOOGL" },
    ],
  });

  await prisma.loan.create({
    data: {
      userId: alice.id,
      type: "AUTO",
      amount: 25000,
      termMonths: 60,
      rate: 5.9,
      balance: 18000,
      status: "ACTIVE",
    },
  });

  await prisma.notification.createMany({
    data: [
      { userId: alice.id, title: "Transfer completed", body: "Your transfer of $500 was successful." },
      { userId: alice.id, title: "Budget alert", body: "You have used 80% of your Groceries budget." },
      { userId: alice.id, title: "Security", body: "New login from Chrome on Windows.", read: true },
    ],
  });

  await prisma.account.create({
    data: { userId: bob.id, name: "Premium Checking", type: "CHECKING", balance: 89000 },
  });

  console.log("Seed complete:");
  console.log(`  Alice: ${SEED_USERS.alice.email} / ${SEED_USERS.alice.password}`);
  console.log(`  Bob:   ${SEED_USERS.bob.email} / ${SEED_USERS.bob.password}`);
  console.log(`  Admin: ${SEED_USERS.admin.email} / ${SEED_USERS.admin.password}`);
  console.log(`  Payee id for bill pay tests: ${payee.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
