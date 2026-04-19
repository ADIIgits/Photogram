import { eq, sql, and } from "drizzle-orm";
import { db, likesTable, usersTable } from "@workspace/db";
import { toSafeUser } from "./user.model";

export async function findLike(postId: number, userId: number) {
  const [row] = await db
    .select()
    .from(likesTable)
    .where(and(eq(likesTable.postId, postId), eq(likesTable.userId, userId)));
  return row ?? null;
}

export async function insertLike(postId: number, userId: number): Promise<void> {
  await db.insert(likesTable).values({ postId, userId });
}

export async function deleteLike(postId: number, userId: number): Promise<void> {
  await db
    .delete(likesTable)
    .where(and(eq(likesTable.postId, postId), eq(likesTable.userId, userId)));
}

export async function countLikesByPost(postId: number): Promise<number> {
  const [r] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(likesTable)
    .where(eq(likesTable.postId, postId));
  return r?.count ?? 0;
}

export async function getLikeUsersByPost(postId: number) {
  const rows = await db.select().from(likesTable).where(eq(likesTable.postId, postId));
  const users = await Promise.all(
    rows.map(async (l) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, l.userId));
      return user ? toSafeUser(user) : null;
    }),
  );
  return users.filter(Boolean);
}
