import { Router } from "express";
import { LIMITS } from "@finvault/shared";
import { transferSchema } from "@finvault/shared";
import { prisma } from "../lib/prisma.js";
import { audit, requireAuth } from "../lib/auth.js";
import { badRequest, notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

export const transfersRouter = Router();

transfersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const status = req.query.status as string | undefined;
    const transfers = await prisma.transfer.findMany({
      where: { userId: user.id, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      include: { fromAccount: { select: { id: true, name: true } } },
    });
    res.json({ transfers });
  })
);

transfersRouter.get(
  "/scheduled",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const transfers = await prisma.transfer.findMany({
      where: { userId: user.id, status: "PENDING", scheduledDate: { not: null } },
      orderBy: { scheduledDate: "asc" },
    });
    res.json({ transfers });
  })
);

transfersRouter.post(
  "/",
  validateBody(transferSchema),
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const from = await prisma.account.findFirst({
      where: { id: req.body.fromAccountId, userId: user.id, status: "ACTIVE" },
    });
    if (!from) throw notFound("Source account");
    if (from.balance < req.body.amount) throw badRequest("Insufficient funds", "INSUFFICIENT_FUNDS");
    if (req.body.amount > LIMITS.SINGLE_TRANSFER) {
      throw badRequest(`Amount exceeds single transfer limit of ${LIMITS.SINGLE_TRANSFER}`);
    }

    const isScheduled = req.body.scheduledDate && new Date(req.body.scheduledDate) > new Date();
    let transfer = await prisma.transfer.create({
      data: {
        userId: user.id,
        fromAccountId: from.id,
        toAccountId: req.body.toAccountId,
        externalAccountNumber: req.body.externalAccountNumber,
        externalRoutingNumber: req.body.externalRoutingNumber,
        amount: req.body.amount,
        memo: req.body.memo,
        status: isScheduled ? "PENDING" : "PENDING",
        scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : null,
      },
    });

    if (!isScheduled) {
      if (req.body.toAccountId) {
        const to = await prisma.account.findFirst({
          where: { id: req.body.toAccountId, userId: user.id, status: "ACTIVE" },
        });
        if (!to) throw notFound("Destination account");
        if (to.id === from.id) throw badRequest("Cannot transfer to same account");
        await prisma.$transaction([
          prisma.account.update({ where: { id: from.id }, data: { balance: from.balance - req.body.amount } }),
          prisma.account.update({ where: { id: to.id }, data: { balance: to.balance + req.body.amount } }),
          prisma.transaction.create({
            data: {
              accountId: from.id,
              type: "TRANSFER_OUT",
              amount: -req.body.amount,
              balanceAfter: from.balance - req.body.amount,
              referenceId: transfer.id,
            },
          }),
          prisma.transaction.create({
            data: {
              accountId: to.id,
              type: "TRANSFER_IN",
              amount: req.body.amount,
              balanceAfter: to.balance + req.body.amount,
              referenceId: transfer.id,
            },
          }),
          prisma.transfer.update({
            where: { id: transfer.id },
            data: { status: "COMPLETED", completedAt: new Date() },
          }),
        ]);
        transfer = await prisma.transfer.findUniqueOrThrow({ where: { id: transfer.id } });
      } else {
        await prisma.account.update({
          where: { id: from.id },
          data: { balance: from.balance - req.body.amount },
        });
        await prisma.transaction.create({
          data: {
            accountId: from.id,
            type: "TRANSFER_OUT",
            amount: -req.body.amount,
            balanceAfter: from.balance - req.body.amount,
            referenceId: transfer.id,
          },
        });
        transfer = await prisma.transfer.update({
          where: { id: transfer.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }
    }

    await audit(user.id, "TRANSFER", "transfer", { transferId: transfer.id, amount: req.body.amount });
    res.status(201).json({ transfer });
  })
);

transfersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const transfer = await prisma.transfer.findFirst({
      where: { id: req.params.id, userId: user.id },
    });
    if (!transfer) throw notFound("Transfer");
    res.json({ transfer });
  })
);

transfersRouter.post(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const transfer = await prisma.transfer.findFirst({
      where: { id: req.params.id, userId: user.id },
    });
    if (!transfer) throw notFound("Transfer");
    if (transfer.status !== "PENDING") throw badRequest("Only pending transfers can be cancelled");
    const updated = await prisma.transfer.update({
      where: { id: transfer.id },
      data: { status: "CANCELLED" },
    });
    await audit(user.id, "CANCEL_TRANSFER", "transfer");
    res.json({ transfer: updated });
  })
);
