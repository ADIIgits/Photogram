import { prisma } from "@workspace/db";

export async function findPending(email: string) {
  return prisma.pendingVerification.findUnique({ where: { email } });
}

export async function upsertPending(data: {
  email: string;
  name: string;
  passwordHash: string;
  otpHash: string;
  expiresAt: Date;
  resendAt: Date;
}) {
  return prisma.pendingVerification.upsert({
    where: { email: data.email },
    create: { ...data, attempts: 0 },
    update: {
      name: data.name,
      passwordHash: data.passwordHash,
      otpHash: data.otpHash,
      expiresAt: data.expiresAt,
      resendAt: data.resendAt,
      attempts: 0,
    },
  });
}

export async function incrementAttempts(email: string) {
  return prisma.pendingVerification.update({
    where: { email },
    data: { attempts: { increment: 1 } },
  });
}

export async function deletePending(email: string) {
  return prisma.pendingVerification.deleteMany({ where: { email } });
}
