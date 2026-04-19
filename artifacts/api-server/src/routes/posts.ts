import { Router, type IRouter } from "express";
import { eq, sql, desc, and } from "drizzle-orm";
import { db, postsTable, usersTable, camerasTable, likesTable, commentsTable } from "@workspace/db";
import {
  CreatePostBody,
  UpdatePostBody,
  GetPostParams,
  UpdatePostParams,
  DeletePostParams,
  ListPostsQueryParams,
} from "@workspace/api-zod";
import { authMiddleware, optionalAuth } from "../middlewares/authMiddleware";

const router: IRouter = Router();

export async function buildPostResponse(post: typeof postsTable.$inferSelect, currentUserId?: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, post.userId));
  const { passwordHash: _, ...safeUser } = user ?? { passwordHash: "" };

  let camera = null;
  if (post.cameraId) {
    const [cam] = await db.select().from(camerasTable).where(eq(camerasTable.id, post.cameraId));
    camera = cam ?? null;
  }

  const [likesCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(likesTable)
    .where(eq(likesTable.postId, post.id));

  const [commentsCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(commentsTable)
    .where(eq(commentsTable.postId, post.id));

  let isLiked = false;
  if (currentUserId) {
    const [like] = await db
      .select()
      .from(likesTable)
      .where(and(eq(likesTable.postId, post.id), eq(likesTable.userId, currentUserId)));
    isLiked = !!like;
  }

  return {
    ...post,
    user: safeUser,
    camera,
    likesCount: likesCountResult?.count ?? 0,
    commentsCount: commentsCountResult?.count ?? 0,
    isLiked,
  };
}

router.get("/posts", optionalAuth, async (req, res): Promise<void> => {
  const query = ListPostsQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(postsTable);
  const total = countResult?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const posts = await db
    .select()
    .from(postsTable)
    .orderBy(desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const enrichedPosts = await Promise.all(posts.map(p => buildPostResponse(p, req.userId)));
  res.json({ posts: enrichedPosts, total, page, totalPages });
});

router.post("/posts", authMiddleware, async (req, res): Promise<void> => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [post] = await db
    .insert(postsTable)
    .values({ ...parsed.data, userId: req.userId! })
    .returning();
  const enriched = await buildPostResponse(post, req.userId);
  res.status(201).json(enriched);
});

router.get("/posts/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const enriched = await buildPostResponse(post, req.userId);
  res.json(enriched);
});

router.patch("/posts/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = UpdatePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  if (existing.userId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = UpdatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [post] = await db
    .update(postsTable)
    .set(parsed.data)
    .where(eq(postsTable.id, params.data.id))
    .returning();
  const enriched = await buildPostResponse(post, req.userId);
  res.json(enriched);
});

router.delete("/posts/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  if (existing.userId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(postsTable).where(eq(postsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
