import { z } from "zod";
import { ACCOUNT_TYPES, LIMITS, ROLES } from "./constants.js";

export const emailSchema = z.string().email("Invalid email format");
export const passwordSchema = z
  .string()
  .min(LIMITS.PASSWORD_MIN_LENGTH, `Password must be at least ${LIMITS.PASSWORD_MIN_LENGTH} characters`)
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number").optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(ACCOUNT_TYPES),
  initialDeposit: z.number().min(0).max(LIMITS.MAX_DEPOSIT).optional(),
});

export const depositSchema = z.object({
  amount: z.number().min(LIMITS.MIN_DEPOSIT).max(LIMITS.MAX_DEPOSIT),
  memo: z.string().max(200).optional(),
});

export const withdrawSchema = z.object({
  amount: z.number().min(LIMITS.MIN_WITHDRAW).max(LIMITS.MAX_WITHDRAW),
  memo: z.string().max(200).optional(),
});

export const transferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid().optional(),
  externalAccountNumber: z.string().regex(/^\d{8,17}$/).optional(),
  externalRoutingNumber: z.string().regex(/^\d{9}$/).optional(),
  amount: z.number().positive().max(LIMITS.SINGLE_TRANSFER),
  memo: z.string().max(200).optional(),
  scheduledDate: z.string().datetime().optional(),
}).refine(
  (d) => d.toAccountId || (d.externalAccountNumber && d.externalRoutingNumber),
  { message: "Provide toAccountId or external account details" }
);

export const payeeSchema = z.object({
  name: z.string().min(1).max(100),
  accountNumber: z.string().regex(/^\d{4,17}$/),
  routingNumber: z.string().regex(/^\d{9}$/),
  nickname: z.string().max(50).optional(),
});

export const billPaySchema = z.object({
  payeeId: z.string().uuid(),
  fromAccountId: z.string().uuid(),
  amount: z.number().positive().max(LIMITS.SINGLE_TRANSFER),
  dueDate: z.string().datetime().optional(),
});

export const budgetSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  monthlyLimit: z.number().positive().max(1_000_000),
});

export const orderSchema = z.object({
  portfolioId: z.string().uuid(),
  symbol: z.string().min(1).max(10),
  side: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive().max(10000),
  orderType: z.enum(["MARKET", "LIMIT"]),
  limitPrice: z.number().positive().optional(),
});

export const loanApplySchema = z.object({
  type: z.enum(["PERSONAL", "AUTO", "MORTGAGE"]),
  amount: z.number().positive().max(5_000_000),
  termMonths: z.number().int().min(6).max(360),
  purpose: z.string().max(500).optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
  preferences: z
    .object({
      theme: z.enum(["light", "dark", "system"]).optional(),
      notificationsEmail: z.boolean().optional(),
      notificationsSms: z.boolean().optional(),
      currency: z.enum(["USD", "EUR", "GBP"]).optional(),
    })
    .optional(),
});

export const roleSchema = z.enum(ROLES);
