import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request } from "express";
import { prisma } from "./prisma.js";
import { forbidden, unauthorized } from "./errors.js";
import type { Role } from "@finvault/shared";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthUser) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "24h",
  });
}

export function verifyToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as Role,
    };
  } catch {
    throw unauthorized("Invalid or expired token");
  }
}

export function getBearerToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export async function requireAuth(req: Request): Promise<AuthUser> {
  const token = getBearerToken(req);
  if (!token) throw unauthorized();
  return verifyToken(token);
}

export async function requireRole(req: Request, ...roles: Role[]) {
  const user = await requireAuth(req);
  if (!roles.includes(user.role)) throw forbidden();
  return user;
}

export async function audit(
  userId: string | null,
  action: string,
  resource: string,
  details?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: {
      userId: userId ?? undefined,
      action,
      resource,
      details: details ? JSON.stringify(details) : undefined,
    },
  });
}
