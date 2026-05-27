import { Router } from "express";
import { billPaySchema, payeeSchema } from "@finvault/shared";
import { prisma } from "../lib/prisma.js";
import { audit, requireAuth } from "../lib/auth.js";
import { badRequest, notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

export const payeesRouter = Router();

payeesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const payees = await prisma.payee.findMany({ where: { userId: user.id } });
    res.json({ payees });
  })
);

payeesRouter.post(
  "/",
  validateBody(payeeSchema),
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const payee = await prisma.payee.create({
      data: { userId: user.id, ...req.body },
    });
    await audit(user.id, "CREATE_PAYEE", "payee");
    res.status(201).json({ payee });
  })
);

payeesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const payee = await prisma.payee.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!payee) throw notFound("Payee");
    const updated = await prisma.payee.update({
      where: { id: payee.id },
      data: {
        name: req.body.name ?? payee.name,
        nickname: req.body.nickname ?? payee.nickname,
      },
    });
    res.json({ payee: updated });
  })
);

payeesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const payee = await prisma.payee.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!payee) throw notFound("Payee");
    await prisma.payee.delete({ where: { id: payee.id } });
    res.status(204).send();
  })
);

export const billsRouter = Router();

billsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const bills = await prisma.billPayment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ bills });
  })
);

billsRouter.get(
  "/history",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const bills = await prisma.billPayment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ bills });
  })
);

billsRouter.post(
  "/pay",
  validateBody(billPaySchema),
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const payee = await prisma.payee.findFirst({ where: { id: req.body.payeeId, userId: user.id } });
    if (!payee) throw notFound("Payee");
    const account = await prisma.account.findFirst({
      where: { id: req.body.fromAccountId, userId: user.id, status: "ACTIVE" },
    });
    if (!account) throw notFound("Account");
    if (account.balance < req.body.amount) throw badRequest("Insufficient funds", "INSUFFICIENT_FUNDS");

    const newBalance = account.balance - req.body.amount;
    const [bill] = await prisma.$transaction([
      prisma.account.update({ where: { id: account.id }, data: { balance: newBalance } }),
      prisma.billPayment.create({
        data: {
          userId: user.id,
          payeeId: payee.id,
          fromAccountId: account.id,
          amount: req.body.amount,
          dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        },
      }),
      prisma.transaction.create({
        data: {
          accountId: account.id,
          type: "BILL_PAY",
          amount: -req.body.amount,
          balanceAfter: newBalance,
          memo: `Bill pay to ${payee.name}`,
        },
      }),
    ]);
    await audit(user.id, "BILL_PAY", "bill");
    res.status(201).json({ bill });
  })
);

billsRouter.post(
  "/schedule",
  validateBody(billPaySchema),
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const bill = await prisma.billPayment.create({
      data: {
        userId: user.id,
        payeeId: req.body.payeeId,
        fromAccountId: req.body.fromAccountId,
        amount: req.body.amount,
        status: "PENDING",
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : new Date(),
      },
    });
    res.status(201).json({ bill });
  })
);
