/* services/otp.service.ts — email OTP verification flow for signup.
 *
 * Flow:
 *   1. sendVerificationOtp  — validate inputs, generate OTP, store a hashed
 *      pending record in the DB, and email the OTP to the user.
 *   2. verifyOtpAndCreateUser — compare the submitted OTP against the stored
 *      hash; if valid, create the real user account and issue tokens.
 *
 * Security considerations:
 *   - Only @gmail.com addresses are accepted (configured in isGmailAddress).
 *   - OTP hashes are stored (not plain-text); brute-force is limited by
 *     MAX_ATTEMPTS before the pending record is wiped.
 *   - A resend cooldown prevents OTP spam.
 *   - Pending records expire independently (expiresAt). */

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

/* Step 1: generate and email an OTP for the given signup details.
 * Stores name + passwordHash in the pending table so they're available
 * at verification time without requiring a second form submission. */
export async function sendVerificationOtp(
  name: string,
  email: string,
  password: string,
) {
  /* Only Gmail addresses — matches the SMTP sender for deliverability */
  if (!isGmailAddress(email)) {
    throw Object.assign(
      new Error("Only Gmail addresses (@gmail.com) are accepted."),
      { status: 400 },
    );
  }

  /* Prevent creating duplicate accounts */
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw Object.assign(new Error("An account with this email already exists."), { status: 409 });
  }

  /* Enforce resend cooldown: reject if a previous code is still within its window */
  const existing = await findPending(email);
  if (existing?.resendAt && existing.resendAt > new Date()) {
    const secondsLeft = Math.ceil((existing.resendAt.getTime() - Date.now()) / 1000);
    throw Object.assign(
      new Error(`Please wait ${secondsLeft}s before requesting another code.`),
      { status: 429, secondsLeft },
    );
  }

  const otp = generateOtp();
  const passwordHash = await hashPassword(password);

  /* Upsert the pending row (create or replace) */
  const pending = await upsertPending({
    email,
    name,
    passwordHash,
    otpHash: hashOtp(otp),
    expiresAt: otpExpiresAt(),
    resendAt: nextResendAt(),
  });

  /* Send the OTP email (or log to console in dev without SMTP creds) */
  await sendOtpEmail(email, otp, name);

  return {
    resendAvailableAt: pending.resendAt!.toISOString(),
    expiresAt: pending.expiresAt.toISOString(),
  };
}

/* Step 2: verify the submitted OTP and, if valid, create the user account. */
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

  /* Reject if the OTP window has passed */
  if (pending.expiresAt < new Date()) {
    await deletePending(email);
    throw Object.assign(
      new Error("Verification code has expired. Please start over."),
      { status: 410 },
    );
  }

  /* Reject and wipe the record if too many wrong guesses */
  if (pending.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    await deletePending(email);
    throw Object.assign(
      new Error("Too many incorrect attempts. Please restart signup to get a new code."),
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

  /* Guard against a race where the email was registered between OTP send and verify */
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    await deletePending(email);
    throw Object.assign(new Error("An account with this email already exists."), { status: 409 });
  }

  /* OTP is valid — create the real user and clean up the pending record */
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
