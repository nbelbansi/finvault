import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { audit, requireAuth } from "../lib/auth.js";
import { badRequest, notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const cardsRouter = Router();

cardsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const cards = await prisma.card.findMany({ where: { userId: user.id } });
    res.json({ cards });
  })
);

cardsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const { linkedAccountId, brand = "VISA" } = req.body as { linkedAccountId?: string; brand?: string };
    const lastFour = String(Math.floor(1000 + Math.random() * 9000));
    const card = await prisma.card.create({
      data: { userId: user.id, lastFour, brand, linkedAccountId },
    });
    await audit(user.id, "CREATE_CARD", "card");
    res.status(201).json({ card });
  })
);

cardsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const card = await prisma.card.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!card) throw notFound("Card");
    const updated = await prisma.card.update({
      where: { id: card.id },
      data: { linkedAccountId: req.body.linkedAccountId ?? card.linkedAccountId },
    });
    res.json({ card: updated });
  })
);

cardsRouter.post(
  "/:id/freeze",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const card = await prisma.card.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!card) throw notFound("Card");
    if (card.status === "CANCELLED") throw badRequest("Card is cancelled");
    const updated = await prisma.card.update({ where: { id: card.id }, data: { status: "FROZEN" } });
    await audit(user.id, "FREEZE_CARD", "card");
    res.json({ card: updated });
  })
);

cardsRouter.post(
  "/:id/unfreeze",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const card = await prisma.card.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!card) throw notFound("Card");
    const updated = await prisma.card.update({ where: { id: card.id }, data: { status: "ACTIVE" } });
    res.json({ card: updated });
  })
);

cardsRouter.get(
  "/:id/transactions",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const card = await prisma.card.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!card) throw notFound("Card");
    res.json({
      transactions: [
        { id: "1", merchant: "Coffee Shop", amount: -4.5, date: new Date().toISOString() },
        { id: "2", merchant: "Grocery Store", amount: -87.23, date: new Date().toISOString() },
      ],
    });
  })
);

cardsRouter.post(
  "/:id/limits",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const card = await prisma.card.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!card) throw notFound("Card");
    const { dailyLimit } = req.body as { dailyLimit?: number };
    if (!dailyLimit || dailyLimit < 100 || dailyLimit > 50000) {
      throw badRequest("Daily limit must be between 100 and 50000");
    }
    const updated = await prisma.card.update({ where: { id: card.id }, data: { dailyLimit } });
    res.json({ card: updated });
  })
);
