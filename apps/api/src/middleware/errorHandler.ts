import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.errors.map((e) => e.message).join("; "),
      code: "VALIDATION_ERROR",
    });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
