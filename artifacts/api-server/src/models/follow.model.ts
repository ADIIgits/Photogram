import { eq, and } from "drizzle-orm";
import { db, followsTable } from "@workspace/db";

export async function findFollow(followerId: number, followingId: number) {
  const [row] = await db
    .select()
    .from(followsTable)
    .where(and(eq(followsTable.followerId, followerId), eq(followsTable.followingId, followingId)));
  return row ?? null;
}

export async function insertFollow(followerId: number, followingId: number): Promise<void> {
  await db.insert(followsTable).values({ followerId, followingId }).onConflictDoNothing();
}

export async function deleteFollow(followerId: number, followingId: number): Promise<void> {
  await db
    .delete(followsTable)
    .where(and(eq(followsTable.followerId, followerId), eq(followsTable.followingId, followingId)));
}

export async function getFollowingIds(userId: number): Promise<number[]> {
  const rows = await db
    .select({ followingId: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, userId));
  return rows.map((r) => r.followingId);
}
