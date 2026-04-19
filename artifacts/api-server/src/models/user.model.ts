import { eq, sql } from "drizzle-orm";
import { db, usersTable, postsTable, followsTable } from "@workspace/db";

export type UserRow = typeof usersTable.$inferSelect;
export type SafeUser = Omit<UserRow, "passwordHash">;

export function toSafeUser(user: UserRow): SafeUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  return user ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  return user ?? null;
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRow> {
  const [user] = await db.insert(usersTable).values(data).returning();
  return user;
}

export async function updateUser(
  id: number,
  data: Partial<Pick<UserRow, "name" | "bio" | "avatarUrl">>,
): Promise<UserRow | null> {
  const [user] = await db.update(usersTable).set(data).where(eq(usersTable.id, id)).returning();
  return user ?? null;
}

export async function getUserStats(userId: number) {
  const [postsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postsTable)
    .where(eq(postsTable.userId, userId));

  const [followersCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followingId, userId));

  const [followingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followerId, userId));

  return {
    postsCount: postsCount?.count ?? 0,
    followersCount: followersCount?.count ?? 0,
    followingCount: followingCount?.count ?? 0,
  };
}
