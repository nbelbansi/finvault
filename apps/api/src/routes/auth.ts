import { Router } from "express";
import { randomBytes } from "crypto";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "@finvault/shared";
import { prisma } from "../lib/prisma.js";
import {
  audit,
  hashPassword,
  requireAuth,
  signToken,
  verifyPassword,
} from "../lib/auth.js";
import { badRequest, unauthorized } from "../lib/errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (existing) throw badRequest("Email already registered", "EMAIL_EXISTS");

    const passwordHash = await hashPassword(req.body.password);
    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        passwordHash,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
      },
    });

    await audit(user.id, "REGISTER", "user", { email: user.email });
    const token = signToken({ id: user.id, email: user.email, role: user.role as "CUSTOMER" });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
  })
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (!user || !(await verifyPassword(req.body.password, user.passwordHash))) {
      throw unauthorized("Invalid email or password");
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role as "CUSTOMER" });
    await audit(user.id, "LOGIN", "user");
    res.json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    await audit(user.id, "LOGOUT", "user");
    res.json({ message: "Logged out" });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const user = await requireAuth(req);
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw unauthorized();
    const token = signToken({ id: dbUser.id, email: dbUser.email, role: dbUser.role as "CUSTOMER" });
    res.json({ token });
  })
);

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const email = String(req.body.email ?? "");
    if (!email) throw badRequest("Email is required");
    const token = randomBytes(32).toString("hex");
    await prisma.passwordReset.create({
      data: { email, token, expiresAt: new Date(Date.now() + 3600000) },
    });
    res.json({ message: "If the email exists, a reset link was sent", resetToken: token });
  })
);

authRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) throw badRequest("Token and password required");
    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.used || reset.expiresAt < new Date()) {
      throw badRequest("Invalid or expired token", "INVALID_TOKEN");
    }
    const user = await prisma.user.findUnique({ where: { email: reset.email } });
    if (!user) throw badRequest("User not found");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
    await prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } });
    res.json({ message: "Password updated" });
  })
);

authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const user = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!user) throw unauthorized();
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      preferences: JSON.parse(user.preferences),
    });
  })
);

authRouter.patch(
  "/me",
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const data: Record<string, unknown> = {};
    if (req.body.firstName) data.firstName = req.body.firstName;
    if (req.body.lastName) data.lastName = req.body.lastName;
    if (req.body.phone) data.phone = req.body.phone;
    if (req.body.preferences) {
      const current = await prisma.user.findUnique({ where: { id: auth.id } });
      const prefs = JSON.parse(current?.preferences ?? "{}");
      data.preferences = JSON.stringify({ ...prefs, ...req.body.preferences });
    }
    const user = await prisma.user.update({ where: { id: auth.id }, data });
    await audit(auth.id, "UPDATE_PROFILE", "user");
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      preferences: JSON.parse(user.preferences),
    });
  })
);
