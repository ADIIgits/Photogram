/* services/auth.service.ts — core authentication business logic.
 *
 * signup   — creates a new user account after hashing the password.
 * login    — validates credentials and issues a token pair.
 * refresh  — validates a refresh token and issues a new token pair.
 * getMe    — fetches the currently-authenticated user by ID.
 *
 * All functions throw errors with a `status` property so the error middleware
 * can forward the correct HTTP status code without extra boilerplate. */

import { findUserByEmail, findUserById, createUser, toSafeUser } from "../models/user.model";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/auth";

/* Register a new user. Rejects if the email is already taken. */
export async function signup(name: string, email: string, password: string) {
  const existing = await findUserByEmail(email);
  if (existing) throw Object.assign(new Error("Email already in use"), { status: 409 });

  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash });

  /* Issue both tokens immediately so the user is logged in after signup */
  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

  return { user: toSafeUser(user), accessToken, refreshToken };
}

/* Authenticate with email + password. Returns a new token pair on success. */
export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  /* Return a generic error — don't reveal whether the email exists */
  if (!user) throw Object.assign(new Error("Invalid credentials"), { status: 401 });

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error("Invalid credentials"), { status: 401 });

  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

  return { user: toSafeUser(user), accessToken, refreshToken };
}

/* Exchange a valid refresh token for a new access + refresh token pair.
 * The old refresh token is implicitly invalidated by the client discarding it. */
export async function refreshTokens(token: string) {
  const payload = verifyRefreshToken(token);
  const accessToken = signAccessToken({ userId: payload.userId, email: payload.email });
  const refreshToken = signRefreshToken({ userId: payload.userId, email: payload.email });
  return { accessToken, refreshToken };
}

/* Fetch the authenticated user's profile for GET /auth/me */
export async function getMe(userId: number) {
  const user = await findUserById(userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 401 });
  return toSafeUser(user);
}
