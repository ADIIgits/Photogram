import { Router, type IRouter } from "express";
import { eq, sql, desc, inArray } from "drizzle-orm";
import { db, postsTable, followsTable, likesTable, commentsTable, usersTable } from "@workspace/db";
import {
  GetFeedQueryParams,
  GetDiscoverQueryParams,
} from "@workspace/api-zod";
import { authMiddleware, optionalAuth } from "../middlewares/authMiddleware";
import { buildPostResponse } from "./posts";

const router: IRouter = Router();

router.get("/feed", authMiddleware, async (req, res): Promise<void> => {
  const query = GetFeedQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const following = await db
    .select({ followingId: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, req.userId!));

  const followingIds = following.map((f) => f.followingId);
  // Include own posts too
  followingIds.push(req.userId!);

  if (followingIds.length === 0) {
    res.json({ posts: [], total: 0, page, totalPages: 0 });
    return;
  }

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postsTable)
    .where(inArray(postsTable.userId, followingIds));

  const total = countResult?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const posts = await db
    .select()
    .from(postsTable)
    .where(inArray(postsTable.userId, followingIds))
    .orderBy(desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const enrichedPosts = await Promise.all(posts.map(p => buildPostResponse(p, req.userId)));
  res.json({ posts: enrichedPosts, total, page, totalPages });
});

router.get("/discover", optionalAuth, async (req, res): Promise<void> => {
  const query = GetDiscoverQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(postsTable);
  const total = countResult?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  // Sort by likes count (trending)
  const posts = await db
    .select({
      post: postsTable,
      likesCount: sql<number>`(SELECT count(*) FROM likes WHERE likes.post_id = ${postsTable.id})::int`,
    })
    .from(postsTable)
    .orderBy(sql`(SELECT count(*) FROM likes WHERE likes.post_id = ${postsTable.id}) DESC, ${postsTable.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  const enrichedPosts = await Promise.all(posts.map(p => buildPostResponse(p.post, req.userId)));
  res.json({ posts: enrichedPosts, total, page, totalPages });
});

router.get("/stats/summary", optionalAuth, async (_req, res): Promise<void> => {
  const [totalPosts] = await db.select({ count: sql<number>`count(*)::int` }).from(postsTable);
  const [totalUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [totalLikes] = await db.select({ count: sql<number>`count(*)::int` }).from(likesTable);
  const [totalComments] = await db.select({ count: sql<number>`count(*)::int` }).from(commentsTable);

  const trendingRaw = await db
    .select({ post: postsTable })
    .from(postsTable)
    .orderBy(sql`(SELECT count(*) FROM likes WHERE likes.post_id = ${postsTable.id}) DESC`)
    .limit(6);

  const trendingPosts = await Promise.all(trendingRaw.map(p => buildPostResponse(p.post)));

  res.json({
    totalPosts: totalPosts?.count ?? 0,
    totalUsers: totalUsers?.count ?? 0,
    totalLikes: totalLikes?.count ?? 0,
    totalComments: totalComments?.count ?? 0,
    trendingPosts,
  });
});

export default router;
