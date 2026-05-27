import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { badRequest } from "../lib/errors.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const msg = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      next(badRequest(msg, "VALIDATION_ERROR"));
      return;
    }
    req.body = result.data;
    next();
  };
}
