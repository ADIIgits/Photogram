import { eq, asc } from "drizzle-orm";
import { db, commentsTable, usersTable } from "@workspace/db";
import { toSafeUser } from "./user.model";

export type CommentRow = typeof commentsTable.$inferSelect;

export async function findCommentsByPost(postId: number) {
  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.postId, postId))
    .orderBy(asc(commentsTable.createdAt));

  return Promise.all(
    comments.map(async (c) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, c.userId));
      return { ...c, user: user ? toSafeUser(user) : null };
    }),
  );
}

export async function findCommentById(id: number): Promise<CommentRow | null> {
  const [comment] = await db.select().from(commentsTable).where(eq(commentsTable.id, id));
  return comment ?? null;
}

export async function createComment(data: {
  content: string;
  postId: number;
  userId: number;
}): Promise<CommentRow> {
  const [comment] = await db.insert(commentsTable).values(data).returning();
  return comment;
}

export async function deleteComment(id: number): Promise<void> {
  await db.delete(commentsTable).where(eq(commentsTable.id, id));
}
