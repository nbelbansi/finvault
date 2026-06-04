import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";
import { notFound } from "../lib/errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const unreadOnly = req.query.unread === "true";
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: "desc" },
    });
    res.json({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
  })
);

notificationsRouter.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const n = await prisma.notification.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!n) throw notFound("Notification");
    const updated = await prisma.notification.update({ where: { id: n.id }, data: { read: true } });
    res.json({ notification: updated });
  })
);

notificationsRouter.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    await prisma.notification.updateMany({ where: { userId: user.id }, data: { read: true } });
    res.json({ message: "All notifications marked as read" });
  })
);

notificationsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const n = await prisma.notification.findFirst({ where: { id: (req.params.id as string), userId: user.id } });
    if (!n) throw notFound("Notification");
    await prisma.notification.delete({ where: { id: n.id } });
    res.status(204).send();
  })
);
