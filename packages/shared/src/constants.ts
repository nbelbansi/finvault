export const ROLES = ["CUSTOMER", "PREMIUM", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ACCOUNT_TYPES = ["CHECKING", "SAVINGS", "MONEY_MARKET"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_STATUSES = ["ACTIVE", "FROZEN", "CLOSED"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const TRANSFER_STATUSES = ["PENDING", "COMPLETED", "FAILED", "CANCELLED"] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const CARD_STATUSES = ["ACTIVE", "FROZEN", "CANCELLED"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export const ORDER_STATUSES = ["PENDING", "FILLED", "CANCELLED", "REJECTED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const LOAN_STATUSES = ["PENDING", "APPROVED", "ACTIVE", "PAID_OFF", "REJECTED"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const LIMITS = {
  DAILY_TRANSFER: 25000,
  SINGLE_TRANSFER: 10000,
  MIN_DEPOSIT: 0.01,
  MAX_DEPOSIT: 500000,
  MIN_WITHDRAW: 0.01,
  MAX_WITHDRAW: 10000,
  PASSWORD_MIN_LENGTH: 8,
  PREMIUM_DAILY_TRANSFER: 100000,
} as const;

export const SEED_USERS = {
  alice: { email: "alice@finvault.test", password: "Password123!", role: "CUSTOMER" as Role },
  bob: { email: "bob@finvault.test", password: "Password123!", role: "PREMIUM" as Role },
  admin: { email: "admin@finvault.test", password: "Admin123!", role: "ADMIN" as Role },
} as const;
