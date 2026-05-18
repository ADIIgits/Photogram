import type { Request, Response } from "express";
import { GetFeedQueryParams, GetDiscoverQueryParams } from "../api-validators";
import {
  getFeedPosts,
  getDiscoverPosts,
  buildPostView,
} from "../services/post.service";
import { getFollowingIds } from "../models/follow.model";
import { prisma } from "../db";

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
  const [totalPosts, totalUsers, totalLikes, totalComments, trendingRaw] =
    await Promise.all([
      prisma.post.count(),
      prisma.user.count(),
      prisma.like.count(),
      prisma.comment.count(),
      prisma.post.findMany({
        orderBy: [{ likes: { _count: "desc" } }],
        take: 6,
      }),
    ]);

  const trendingPosts = await Promise.all(trendingRaw.map((p) => buildPostView(p)));

  res.json({
    totalPosts,
    totalUsers,
    totalLikes,
    totalComments,
    trendingPosts,
  });
}
