import { eq, sql, desc } from "drizzle-orm";
import { db, postsTable } from "@workspace/db";

export type PostRow = typeof postsTable.$inferSelect;
export type CreatePostData = Pick<PostRow, "title" | "imageUrl"> &
  Partial<Pick<PostRow, "caption" | "cameraId">>;

export async function findPostById(id: number): Promise<PostRow | null> {
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
  return post ?? null;
}

export async function listPosts(opts: { limit: number; offset: number }): Promise<PostRow[]> {
  return db.select().from(postsTable).orderBy(desc(postsTable.createdAt)).limit(opts.limit).offset(opts.offset);
}

export async function listPostsByUser(
  userId: number,
  opts: { limit: number; offset: number },
): Promise<PostRow[]> {
  return db
    .select()
    .from(postsTable)
    .where(eq(postsTable.userId, userId))
    .orderBy(sql`${postsTable.createdAt} DESC`)
    .limit(opts.limit)
    .offset(opts.offset);
}

export async function listPostsByUserIds(
  userIds: number[],
  opts: { limit: number; offset: number },
): Promise<PostRow[]> {
  const { inArray } = await import("drizzle-orm");
  return db
    .select()
    .from(postsTable)
    .where(inArray(postsTable.userId, userIds))
    .orderBy(desc(postsTable.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);
}

export async function listPostsTrending(opts: { limit: number; offset: number }): Promise<PostRow[]> {
  const rows = await db
    .select({ post: postsTable })
    .from(postsTable)
    .orderBy(
      sql`(SELECT count(*) FROM likes WHERE likes.post_id = ${postsTable.id}) DESC, ${postsTable.createdAt} DESC`,
    )
    .limit(opts.limit)
    .offset(opts.offset);
  return rows.map((r) => r.post);
}

export async function countPosts(): Promise<number> {
  const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(postsTable);
  return r?.count ?? 0;
}

export async function countPostsByUser(userId: number): Promise<number> {
  const [r] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postsTable)
    .where(eq(postsTable.userId, userId));
  return r?.count ?? 0;
}

export async function countPostsByUserIds(userIds: number[]): Promise<number> {
  const { inArray } = await import("drizzle-orm");
  const [r] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postsTable)
    .where(inArray(postsTable.userId, userIds));
  return r?.count ?? 0;
}

export async function createPost(
  data: CreatePostData & { userId: number },
): Promise<PostRow> {
  const [post] = await db.insert(postsTable).values(data).returning();
  return post;
}

export async function updatePost(
  id: number,
  data: Partial<Pick<PostRow, "title" | "caption" | "imageUrl" | "cameraId">>,
): Promise<PostRow | null> {
  const [post] = await db.update(postsTable).set(data).where(eq(postsTable.id, id)).returning();
  return post ?? null;
}

export async function deletePost(id: number): Promise<void> {
  await db.delete(postsTable).where(eq(postsTable.id, id));
}
