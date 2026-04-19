import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, postsTable, followsTable } from "@workspace/db";
import { UpdateUserBody, GetUserParams, UpdateUserParams, FollowUserParams, UnfollowUserParams, GetUserPostsParams, GetUserPostsQueryParams } from "@workspace/api-zod";
import { authMiddleware, optionalAuth } from "../middlewares/authMiddleware";
import { buildPostResponse } from "./posts";

const router: IRouter = Router();

router.get("/users/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = params.data.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [postsCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postsTable)
    .where(eq(postsTable.userId, userId));

  const [followersCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followingId, userId));

  const [followingCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followerId, userId));

  let isFollowing = false;
  if (req.userId) {
    const [follow] = await db
      .select()
      .from(followsTable)
      .where(eq(followsTable.followerId, req.userId))
      .where(eq(followsTable.followingId, userId));
    isFollowing = !!follow;
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json({
    ...safeUser,
    postsCount: postsCountResult?.count ?? 0,
    followersCount: followersCountResult?.count ?? 0,
    followingCount: followingCountResult?.count ?? 0,
    isFollowing,
  });
});

router.patch("/users/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (params.data.id !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, params.data.id))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

router.post("/users/:id/follow", authMiddleware, async (req, res): Promise<void> => {
  const params = FollowUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const targetId = params.data.id;
  if (targetId === req.userId) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  try {
    await db.insert(followsTable).values({ followerId: req.userId!, followingId: targetId }).onConflictDoNothing();
    res.json({ message: "Followed successfully" });
  } catch {
    res.status(409).json({ error: "Already following" });
  }
});

router.delete("/users/:id/follow", authMiddleware, async (req, res): Promise<void> => {
  const params = UnfollowUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(followsTable)
    .where(eq(followsTable.followerId, req.userId!))
    .where(eq(followsTable.followingId, params.data.id));
  res.json({ message: "Unfollowed successfully" });
});

router.get("/users/:id/posts", optionalAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const params = GetUserPostsParams.safeParse({ id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query = GetUserPostsQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postsTable)
    .where(eq(postsTable.userId, params.data.id));

  const total = countResult?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.userId, params.data.id))
    .orderBy(sql`${postsTable.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  const enrichedPosts = await Promise.all(posts.map(p => buildPostResponse(p, req.userId)));
  res.json({ posts: enrichedPosts, total, page, totalPages });
});

export default router;
