import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { audit, requireRole } from "../lib/auth.js";
import { notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const adminRouter = Router();

adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    await requireRole(req, "ADMIN");
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    const total = await prisma.user.count();
    res.json({ users, page, limit, total });
  })
);

adminRouter.patch(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const admin = await requireRole(req, "ADMIN");
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw notFound("User");
    const { role, frozen } = req.body as { role?: string; frozen?: boolean };
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(role ? { role } : {}),
      },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });
    await audit(admin.id, "ADMIN_UPDATE_USER", "user", { targetId: user.id, role, frozen });
    res.json({ user: updated });
  })
);

adminRouter.get(
  "/audit-logs",
  asyncHandler(async (req, res) => {
    await requireRole(req, "ADMIN");
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { email: true } } },
    });
    res.json({ logs });
  })
);

adminRouter.post(
  "/maintenance",
  asyncHandler(async (req, res) => {
    const admin = await requireRole(req, "ADMIN");
    const { enabled, message } = req.body as { enabled?: boolean; message?: string };
    await audit(admin.id, "MAINTENANCE_MODE", "system", { enabled, message });
    res.json({ maintenance: { enabled: !!enabled, message: message ?? "System maintenance" } });
  })
);

adminRouter.get(
  "/metrics",
  asyncHandler(async (req, res) => {
    await requireRole(req, "ADMIN");
    const [users, accounts, transfers, loans] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.transfer.count(),
      prisma.loan.count(),
    ]);
    res.json({
      metrics: {
        totalUsers: users,
        totalAccounts: accounts,
        totalTransfers: transfers,
        totalLoans: loans,
        uptime: process.uptime(),
      },
    });
  })
);
