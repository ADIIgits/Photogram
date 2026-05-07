import type { Request, Response } from "express";
import { SignupBody, LoginBody, RefreshTokenBody, SendOtpBody, VerifyOtpBody } from "@workspace/api-zod";
import * as AuthService from "../services/auth.service";
import * as OtpService from "../services/otp.service";

export async function signup(req: Request, res: Response): Promise<void> {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password } = parsed.data;
  const result = await AuthService.signup(name, email, password);
  res.status(201).json(result);
}

export async function sendOtp(req: Request, res: Response): Promise<void> {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password } = parsed.data;
  try {
    const result = await OtpService.sendVerificationOtp(name, email, password);
    res.json(result);
  } catch (err: any) {
    const status = err.status ?? 500;
    res.status(status).json({ error: err.message, ...(err.secondsLeft ? { secondsLeft: err.secondsLeft } : {}) });
  }
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, otp } = parsed.data;
  const result = await OtpService.verifyOtpAndCreateUser(email, otp);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = await AuthService.login(parsed.data.email, parsed.data.password);
  res.json(result);
}

export function logout(_req: Request, res: Response): void {
  res.json({ message: "Logged out successfully" });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await AuthService.getMe(req.userId!);
  res.json(user);
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const parsed = RefreshTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = await AuthService.refreshTokens(parsed.data.refreshToken);
  res.json(result);
}
