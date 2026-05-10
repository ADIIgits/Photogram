/* middlewares/authMiddleware.ts — JWT authentication middleware.
 *
 * authMiddleware  — REQUIRED auth. Rejects requests without a valid Bearer token.
 *                   Attaches userId and userEmail to req so route handlers can
 *                   use them without re-decoding the token.
 *
 * optionalAuth    — OPTIONAL auth. Decodes the token if present; silently ignores
 *                   invalid/missing tokens. Used on public routes (e.g. GET /posts)
 *                   where we want to know who the viewer is without blocking guests. */

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/auth";

/* Extend Express's Request type so req.userId and req.userEmail are always
 * available in TypeScript after passing through auth middleware. */
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userEmail?: string;
    }
  }
}

/* Require a valid Bearer token; respond 401 if missing or invalid */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7); /* Strip "Bearer " prefix */
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* Attempt to decode the token but never block the request */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = verifyAccessToken(token);
      req.userId = payload.userId;
      req.userEmail = payload.email;
    } catch {
      /* Ignore invalid tokens for optional auth — guest access continues */
    }
  }
  next();
}
