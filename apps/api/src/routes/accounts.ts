import { Router } from "express";
import { createAccountSchema, depositSchema, withdrawSchema } from "@finvault/shared";
import { prisma } from "../lib/prisma.js";
import { audit, requireAuth } from "../lib/auth.js";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

export const accountsRouter = Router();

async function getOwnedAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw notFound("Account");
  return account;
}

accountsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const accounts = await prisma.account.findMany({
      where: { userId: user.id, status: { not: "CLOSED" } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ accounts });
  })
);

accountsRouter.post(
  "/",
  validateBody(createAccountSchema),
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const initial = req.body.initialDeposit ?? 0;
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: req.body.name,
        type: req.body.type,
        balance: initial,
      },
    });
    if (initial > 0) {
      await prisma.transaction.create({
        data: {
          accountId: account.id,
          type: "DEPOSIT",
          amount: initial,
          balanceAfter: initial,
          memo: "Initial deposit",
        },
      });
    }
    await audit(user.id, "CREATE_ACCOUNT", "account", { accountId: account.id });
    res.status(201).json({ account });
  })
);

accountsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const account = await getOwnedAccount(user.id, (req.params.id as string));
    res.json({ account });
  })
);

accountsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const account = await getOwnedAccount(user.id, (req.params.id as string));
    if (account.status === "CLOSED") throw badRequest("Account is closed");
    const { name } = req.body as { name?: string };
    const updated = await prisma.account.update({
      where: { id: account.id },
      data: { name: name ?? account.name },
    });
    res.json({ account: updated });
  })
);

accountsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const account = await getOwnedAccount(user.id, (req.params.id as string));
    if (account.balance !== 0) throw badRequest("Balance must be zero to delete");
    await prisma.account.delete({ where: { id: account.id } });
    res.status(204).send();
  })
);

accountsRouter.get(
  "/:id/transactions",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    await getOwnedAccount(user.id, (req.params.id as string));
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const transactions = await prisma.transaction.findMany({
      where: { accountId: (req.params.id as string) },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.transaction.count({ where: { accountId: (req.params.id as string) } });
    res.json({ transactions, page, limit, total });
  })
);

accountsRouter.get(
  "/:id/balance",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const account = await getOwnedAccount(user.id, (req.params.id as string));
    res.json({ balance: account.balance, currency: "USD" });
  })
);

accountsRouter.post(
  "/:id/deposit",
  validateBody(depositSchema),
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const account = await getOwnedAccount(user.id, (req.params.id as string));
    if (account.status !== "ACTIVE") throw forbidden("Account is not active");
    const newBalance = account.balance + req.body.amount;
    const [updated] = await prisma.$transaction([
      prisma.account.update({ where: { id: account.id }, data: { balance: newBalance } }),
      prisma.transaction.create({
        data: {
          accountId: account.id,
          type: "DEPOSIT",
          amount: req.body.amount,
          balanceAfter: newBalance,
          memo: req.body.memo,
        },
      }),
    ]);
    await audit(user.id, "DEPOSIT", "account", { amount: req.body.amount });
    res.json({ account: updated, balance: newBalance });
  })
);

accountsRouter.post(
  "/:id/withdraw",
  validateBody(withdrawSchema),
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const account = await getOwnedAccount(user.id, (req.params.id as string));
    if (account.status !== "ACTIVE") throw forbidden("Account is not active");
    if (account.balance < req.body.amount) throw badRequest("Insufficient funds", "INSUFFICIENT_FUNDS");
    const newBalance = account.balance - req.body.amount;
    const [updated] = await prisma.$transaction([
      prisma.account.update({ where: { id: account.id }, data: { balance: newBalance } }),
      prisma.transaction.create({
        data: {
          accountId: account.id,
          type: "WITHDRAWAL",
          amount: -req.body.amount,
          balanceAfter: newBalance,
          memo: req.body.memo,
        },
      }),
    ]);
    await audit(user.id, "WITHDRAW", "account", { amount: req.body.amount });
    res.json({ account: updated, balance: newBalance });
  })
);

accountsRouter.post(
  "/:id/close",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const account = await getOwnedAccount(user.id, (req.params.id as string));
    if (account.balance !== 0) throw badRequest("Transfer remaining balance before closing");
    const updated = await prisma.account.update({
      where: { id: account.id },
      data: { status: "CLOSED" },
    });
    await audit(user.id, "CLOSE_ACCOUNT", "account");
    res.json({ account: updated });
  })
);
