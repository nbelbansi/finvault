import { Router } from "express";
import { budgetSchema } from "@finvault/shared";
import { prisma } from "../lib/prisma.js";
import { audit, requireAuth } from "../lib/auth.js";
import { notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

export const budgetsRouter = Router();

budgetsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const budgets = await prisma.budget.findMany({ where: { userId: user.id } });
    res.json({ budgets });
  })
);

budgetsRouter.post(
  "/",
  validateBody(budgetSchema),
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const budget = await prisma.budget.create({ data: { userId: user.id, ...req.body } });
    await audit(user.id, "CREATE_BUDGET", "budget");
    res.status(201).json({ budget });
  })
);

budgetsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const budget = await prisma.budget.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!budget) throw notFound("Budget");
    const updated = await prisma.budget.update({
      where: { id: budget.id },
      data: {
        name: req.body.name ?? budget.name,
        monthlyLimit: req.body.monthlyLimit ?? budget.monthlyLimit,
        spent: req.body.spent ?? budget.spent,
      },
    });
    res.json({ budget: updated });
  })
);

budgetsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const budget = await prisma.budget.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!budget) throw notFound("Budget");
    await prisma.budget.delete({ where: { id: budget.id } });
    res.status(204).send();
  })
);

budgetsRouter.get(
  "/:id/spending",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const budget = await prisma.budget.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!budget) throw notFound("Budget");
    res.json({
      budgetId: budget.id,
      spent: budget.spent,
      limit: budget.monthlyLimit,
      remaining: budget.monthlyLimit - budget.spent,
      percentUsed: (budget.spent / budget.monthlyLimit) * 100,
    });
  })
);

budgetsRouter.post(
  "/:id/alerts",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const budget = await prisma.budget.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!budget) throw notFound("Budget");
    const { alertAtPercent } = req.body as { alertAtPercent?: number };
    const alertAt = budget.monthlyLimit * ((alertAtPercent ?? 80) / 100);
    const updated = await prisma.budget.update({ where: { id: budget.id }, data: { alertAt } });
    res.json({ budget: updated });
  })
);
