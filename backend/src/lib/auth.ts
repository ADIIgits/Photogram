/* lib/auth.ts — password hashing and JWT utilities.
 *
 * Tokens:
 *   Access token  — short-lived (15 min), sent in Authorization: Bearer header
 *   Refresh token — long-lived (7 days), used to issue a new access token
 *
 * Both tokens are signed with the SESSION_SECRET env var.
 * The refresh secret has "-refresh" appended so the two secrets are distinct
 * even when SESSION_SECRET is shared (prevents token type confusion attacks). */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const ACCESS_SECRET = process.env.SESSION_SECRET ?? "photogram-access-secret";
const REFRESH_SECRET = (process.env.SESSION_SECRET ?? "photogram-refresh-secret") + "-refresh";

/* Hash a plain-text password using bcrypt with a cost factor of 10 */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/* Constant-time comparison to avoid timing attacks */
export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* The data encoded inside every JWT */
export interface JwtPayload {
  userId: number;
  email: string;
}

/* Issue a new 15-minute access token */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

/* Issue a new 7-day refresh token */
export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

/* Verify an access token and return its payload.
 * Throws JsonWebTokenError or TokenExpiredError on failure. */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

/* Verify a refresh token and return its payload. */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}
