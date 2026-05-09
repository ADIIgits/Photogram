import { createHash, randomBytes, randomInt } from "node:crypto";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

export const OTP_CONFIG = { OTP_EXPIRY_MS, RESEND_COOLDOWN_MS, MAX_ATTEMPTS };

export function generateOtp(): string {
  return String(randomInt(100_000, 999_999 + 1)).padStart(6, "0");
}

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

export function hashOtp(otp: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(salt + "|" + otp + "|" + getSecret())
    .digest("hex");
  return `${salt}:${hash}`;
}

export function verifyOtp(otp: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = createHash("sha256")
    .update(salt + "|" + otp + "|" + getSecret())
    .digest("hex");
  // Constant-time comparison
  if (expected.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MS);
}

export function nextResendAt(): Date {
  return new Date(Date.now() + RESEND_COOLDOWN_MS);
}

export function isGmailAddress(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@gmail\.com$/i.test(email);
}
