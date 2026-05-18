import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

/* Prefer Neon's pooled URL; fall back to the generic DATABASE_URL */
const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "NEON_DATABASE_URL (or DATABASE_URL) must be set. Did you forget to provision a database?",
  );
}

/* Type augmentation so TypeScript knows about our global prisma cache */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
  /* PrismaPg adapter connects via the pg connection string instead of the
   * default binary engine. Required for Prisma 7 "library" engine mode. */
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    /* Log warnings/errors in dev; errors only in production */
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/* Reuse an existing client across hot-reloads in dev; always create fresh in prod */
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/* Re-export all Prisma model types so consumers don't need to import from @prisma/client directly */
export type {
  User,
  Camera,
  Post,
  Comment,
  Like,
  Follow,
  Suggestion,
  Prisma,
} from "@prisma/client";
