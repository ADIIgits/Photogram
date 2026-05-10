/* middlewares/error.middleware.ts — centralised error and 404 handlers.
 *
 * errorHandler — Express's 4-argument error handler. Catches any error thrown
 *   (or passed via next(err)) in route handlers and service calls. Errors can
 *   attach a numeric `status` property to control the HTTP status code; if none
 *   is set it defaults to 500. Errors >= 500 are logged as unhandled.
 *
 * notFound — Catch-all handler mounted after all routes. Returns 404 JSON for
 *   any request that didn't match a registered route. */

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

  /* Log server-side faults (5xx) but not expected client errors (4xx) */
  if (status >= 500) {
    logger.error({ err }, "Unhandled error");
  }

  res.status(status).json({ error: message });
}

/* Mounted last — handles any path not matched by registered routes */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not found" });
}
