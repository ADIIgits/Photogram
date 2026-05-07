import { findUserByEmail, createUser, toSafeUser } from "../models/user.model";
import {
  findPending,
  upsertPending,
  incrementAttempts,
  deletePending,
} from "../models/verification.model";
import { hashPassword, signAccessToken, signRefreshToken } from "../lib/auth";
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  otpExpiresAt,
  nextResendAt,
  isGmailAddress,
  OTP_CONFIG,
} from "../lib/otp";
import { sendOtpEmail } from "../lib/email.service";

export async function sendVerificationOtp(
  name: string,
  email: string,
  password: string,
) {
  if (!isGmailAddress(email)) {
    throw Object.assign(
      new Error("Only Gmail addresses (@gmail.com) are accepted."),
      { status: 400 },
    );
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw Object.assign(new Error("An account with this email already exists."), {
      status: 409,
    });
  }

  // Enforce resend cooldown on existing pending
  const existing = await findPending(email);
  if (existing?.resendAt && existing.resendAt > new Date()) {
    const secondsLeft = Math.ceil(
      (existing.resendAt.getTime() - Date.now()) / 1000,
    );
    throw Object.assign(
      new Error(`Please wait ${secondsLeft}s before requesting another code.`),
      { status: 429, secondsLeft },
    );
  }

  const otp = generateOtp();
  const passwordHash = await hashPassword(password);
  const pending = await upsertPending({
    email,
    name,
    passwordHash,
    otpHash: hashOtp(otp),
    expiresAt: otpExpiresAt(),
    resendAt: nextResendAt(),
  });

  await sendOtpEmail(email, otp, name);

  return {
    resendAvailableAt: pending.resendAt!.toISOString(),
    expiresAt: pending.expiresAt.toISOString(),
  };
}

export async function verifyOtpAndCreateUser(email: string, otp: string) {
  if (!isGmailAddress(email)) {
    throw Object.assign(new Error("Invalid email."), { status: 400 });
  }

  const pending = await findPending(email);
  if (!pending) {
    throw Object.assign(
      new Error("No pending verification found. Please restart signup."),
      { status: 404 },
    );
  }

  if (pending.expiresAt < new Date()) {
    await deletePending(email);
    throw Object.assign(
      new Error("Verification code has expired. Please start over."),
      { status: 410 },
    );
  }

  if (pending.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    await deletePending(email);
    throw Object.assign(
      new Error(
        "Too many incorrect attempts. Please restart signup to get a new code.",
      ),
      { status: 429 },
    );
  }

  const valid = verifyOtp(otp, pending.otpHash);
  if (!valid) {
    await incrementAttempts(email);
    const remaining = OTP_CONFIG.MAX_ATTEMPTS - pending.attempts - 1;
    throw Object.assign(
      new Error(
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Incorrect code. Please restart signup.",
      ),
      { status: 400 },
    );
  }

  // OTP valid — create the real user, clean up pending row
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    await deletePending(email);
    throw Object.assign(new Error("An account with this email already exists."), {
      status: 409,
    });
  }

  const user = await createUser({
    name: pending.name,
    email: pending.email,
    passwordHash: pending.passwordHash,
  });

  await deletePending(email);

  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

  return { user: toSafeUser(user), accessToken, refreshToken };
}
