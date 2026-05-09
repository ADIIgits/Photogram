import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const error = err as Error & { status?: number };
  const status = error.status ?? 500;
  const message = error.message ?? "Internal server error";

  if (status >= 500) {
    logger.error({ err }, "Unhandled error");
  }

  res.status(status).json({ error: message });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not found" });
}
