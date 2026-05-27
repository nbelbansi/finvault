import { Router } from "express";
import { loanApplySchema } from "@finvault/shared";
import { prisma } from "../lib/prisma.js";
import { audit, requireAuth } from "../lib/auth.js";
import { badRequest, notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

export const loansRouter = Router();

const RATES: Record<string, number> = { PERSONAL: 8.5, AUTO: 5.9, MORTGAGE: 6.2 };

loansRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const loans = await prisma.loan.findMany({ where: { userId: user.id } });
    res.json({ loans });
  })
);

loansRouter.post(
  "/apply",
  validateBody(loanApplySchema),
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const rate = RATES[req.body.type] ?? 10;
    const loan = await prisma.loan.create({
      data: {
        userId: user.id,
        type: req.body.type,
        amount: req.body.amount,
        termMonths: req.body.termMonths,
        rate,
        balance: req.body.amount,
        purpose: req.body.purpose,
        status: "APPROVED",
      },
    });
    await audit(user.id, "APPLY_LOAN", "loan");
    res.status(201).json({ loan });
  })
);

loansRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const loan = await prisma.loan.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!loan) throw notFound("Loan");
    res.json({ loan });
  })
);

loansRouter.post(
  "/:id/payment",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const loan = await prisma.loan.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!loan) throw notFound("Loan");
    const { amount } = req.body as { amount?: number };
    if (!amount || amount <= 0) throw badRequest("Valid payment amount required");
    if (amount > loan.balance) throw badRequest("Payment exceeds balance");
    const newBalance = loan.balance - amount;
    const [updated] = await prisma.$transaction([
      prisma.loan.update({
        where: { id: loan.id },
        data: { balance: newBalance, status: newBalance === 0 ? "PAID_OFF" : loan.status },
      }),
      prisma.loanPayment.create({ data: { loanId: loan.id, amount } }),
    ]);
    await audit(user.id, "LOAN_PAYMENT", "loan");
    res.json({ loan: updated });
  })
);

loansRouter.get(
  "/:id/amortization",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const loan = await prisma.loan.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!loan) throw notFound("Loan");
    const monthlyRate = loan.rate / 100 / 12;
    const payment =
      (loan.amount * monthlyRate * Math.pow(1 + monthlyRate, loan.termMonths)) /
      (Math.pow(1 + monthlyRate, loan.termMonths) - 1);
    const schedule = Array.from({ length: Math.min(12, loan.termMonths) }, (_, i) => ({
      month: i + 1,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(payment * 0.7 * 100) / 100,
      interest: Math.round(payment * 0.3 * 100) / 100,
      balance: Math.max(0, loan.balance - payment * (i + 1)),
    }));
    res.json({ schedule, monthlyPayment: Math.round(payment * 100) / 100 });
  })
);

loansRouter.post(
  "/:id/prepay",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const loan = await prisma.loan.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!loan) throw notFound("Loan");
    const { amount } = req.body as { amount?: number };
    if (!amount) throw badRequest("Amount required");
    const updated = await prisma.loan.update({
      where: { id: loan.id },
      data: { balance: Math.max(0, loan.balance - amount), status: loan.balance - amount <= 0 ? "PAID_OFF" : loan.status },
    });
    res.json({ loan: updated });
  })
);
