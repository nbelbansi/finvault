import { Router } from "express";
import { orderSchema } from "@finvault/shared";
import { prisma } from "../lib/prisma.js";
import { audit, requireAuth } from "../lib/auth.js";
import { badRequest, notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

export const portfoliosRouter = Router();
export const ordersRouter = Router();

portfoliosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: user.id },
      include: { holdings: true },
    });
    res.json({ portfolios });
  })
);

portfoliosRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const { name } = req.body as { name?: string };
    if (!name) throw badRequest("Portfolio name required");
    const portfolio = await prisma.portfolio.create({ data: { userId: user.id, name } });
    res.status(201).json({ portfolio });
  })
);

portfoliosRouter.get(
  "/:id/holdings",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: (req.params.id as string), userId: user.id },
      include: { holdings: true },
    });
    if (!portfolio) throw notFound("Portfolio");
    res.json({ holdings: portfolio.holdings });
  })
);

ordersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ orders });
  })
);

ordersRouter.post(
  "/",
  validateBody(orderSchema),
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: req.body.portfolioId, userId: user.id },
    });
    if (!portfolio) throw notFound("Portfolio");
    if (req.body.orderType === "LIMIT" && !req.body.limitPrice) {
      throw badRequest("Limit price required for limit orders");
    }
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        portfolioId: portfolio.id,
        symbol: req.body.symbol.toUpperCase(),
        side: req.body.side,
        quantity: req.body.quantity,
        orderType: req.body.orderType,
        limitPrice: req.body.limitPrice,
        status: "FILLED",
      },
    });
    const price = req.body.limitPrice ?? 100;
    const existing = await prisma.holding.findFirst({
      where: { portfolioId: portfolio.id, symbol: order.symbol },
    });
    if (req.body.side === "BUY") {
      if (existing) {
        const qty = existing.quantity + req.body.quantity;
        const avg = (existing.avgCost * existing.quantity + price * req.body.quantity) / qty;
        await prisma.holding.update({ where: { id: existing.id }, data: { quantity: qty, avgCost: avg } });
      } else {
        await prisma.holding.create({
          data: { portfolioId: portfolio.id, symbol: order.symbol, quantity: req.body.quantity, avgCost: price },
        });
      }
    } else if (existing && existing.quantity >= req.body.quantity) {
      await prisma.holding.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity - req.body.quantity },
      });
    } else {
      throw badRequest("Insufficient shares to sell");
    }
    await audit(user.id, "PLACE_ORDER", "order");
    res.status(201).json({ order });
  })
);

ordersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const order = await prisma.order.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!order) throw notFound("Order");
    res.json({ order });
  })
);

ordersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const order = await prisma.order.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!order) throw notFound("Order");
    if (order.status !== "PENDING") throw badRequest("Only pending orders can be cancelled");
    const updated = await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    res.json({ order: updated });
  })
);

export const watchlistRouter = Router();

watchlistRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const items = await prisma.watchlistItem.findMany({ where: { userId: user.id } });
    res.json({
      watchlist: items.map((i) => ({
        ...i,
        price: 100 + Math.random() * 50,
        change: (Math.random() - 0.5) * 5,
      })),
    });
  })
);

watchlistRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const { symbol } = req.body as { symbol?: string };
    if (!symbol) throw badRequest("Symbol required");
    const item = await prisma.watchlistItem.create({
      data: { userId: user.id, symbol: symbol.toUpperCase() },
    });
    res.status(201).json({ item });
  })
);

watchlistRouter.delete(
  "/:symbol",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    await prisma.watchlistItem.deleteMany({
      where: { userId: user.id, symbol: (req.params.symbol as string).toUpperCase() },
    });
    res.status(204).send();
  })
);
