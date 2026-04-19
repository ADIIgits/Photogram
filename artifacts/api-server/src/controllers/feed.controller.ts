import type { Request, Response } from "express";
import { GetFeedQueryParams, GetDiscoverQueryParams } from "@workspace/api-zod";
import {
  getFeedPosts,
  getDiscoverPosts,
  buildPostView,
} from "../services/post.service";
import { getFollowingIds } from "../models/follow.model";
import { db, postsTable, usersTable, likesTable, commentsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

export async function getFeed(req: Request, res: Response): Promise<void> {
  const query = GetFeedQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 20) : 20;

  const followingIds = await getFollowingIds(req.userId!);
  const result = await getFeedPosts(req.userId!, followingIds, page, limit);
  res.json(result);
}

export async function getDiscover(req: Request, res: Response): Promise<void> {
  const query = GetDiscoverQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const result = await getDiscoverPosts(page, limit, req.userId);
  res.json(result);
}

export async function getStatsSummary(_req: Request, res: Response): Promise<void> {
  const [totalPosts] = await db.select({ count: sql<number>`count(*)::int` }).from(postsTable);
  const [totalUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [totalLikes] = await db.select({ count: sql<number>`count(*)::int` }).from(likesTable);
  const [totalComments] = await db.select({ count: sql<number>`count(*)::int` }).from(commentsTable);

  const trendingRaw = await db
    .select({ post: postsTable })
    .from(postsTable)
    .orderBy(sql`(SELECT count(*) FROM likes WHERE likes.post_id = ${postsTable.id}) DESC`)
    .limit(6);

  const trendingPosts = await Promise.all(trendingRaw.map((p) => buildPostView(p.post)));

  res.json({
    totalPosts: totalPosts?.count ?? 0,
    totalUsers: totalUsers?.count ?? 0,
    totalLikes: totalLikes?.count ?? 0,
    totalComments: totalComments?.count ?? 0,
    trendingPosts,
  });
}
