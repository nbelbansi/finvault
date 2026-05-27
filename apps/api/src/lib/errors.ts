export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(resource = "Resource") {
  return new AppError(404, `${resource} not found`, "NOT_FOUND");
}

export function forbidden(message = "Forbidden") {
  return new AppError(403, message, "FORBIDDEN");
}

export function unauthorized(message = "Unauthorized") {
  return new AppError(401, message, "UNAUTHORIZED");
}

export function badRequest(message: string, code = "BAD_REQUEST") {
  return new AppError(400, message, code);
}
