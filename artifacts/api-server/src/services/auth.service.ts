import { findUserByEmail, findUserById, createUser, toSafeUser } from "../models/user.model";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/auth";

export async function signup(name: string, email: string, password: string) {
  const existing = await findUserByEmail(email);
  if (existing) throw Object.assign(new Error("Email already in use"), { status: 409 });

  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash });

  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

  return { user: toSafeUser(user), accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) throw Object.assign(new Error("Invalid credentials"), { status: 401 });

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error("Invalid credentials"), { status: 401 });

  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

  return { user: toSafeUser(user), accessToken, refreshToken };
}

export async function refreshTokens(token: string) {
  const payload = verifyRefreshToken(token);
  const accessToken = signAccessToken({ userId: payload.userId, email: payload.email });
  const refreshToken = signRefreshToken({ userId: payload.userId, email: payload.email });
  return { accessToken, refreshToken };
}

export async function getMe(userId: number) {
  const user = await findUserById(userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 401 });
  return toSafeUser(user);
}
