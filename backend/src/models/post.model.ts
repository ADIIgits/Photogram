/* models/post.model.ts — raw database access for the Post table.
 * All functions are thin wrappers around Prisma queries.
 * Business logic (ownership checks, view enrichment) lives in post.service.ts. */

import { prisma, type Post } from "@workspace/db";

export type PostRow = Post;

export type CreatePostData = {
  title: string;
  imageUrl: string;
  caption?: string | null;
  cameraId?: number | null;
};

/* Find a single post by primary key */
export async function findPostById(id: number): Promise<Post | null> {
  return prisma.post.findUnique({ where: { id } });
}

/* All posts, newest first — used by the public /posts listing */
export async function listPosts(opts: { limit: number; offset: number }): Promise<Post[]> {
  return prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    skip: opts.offset,
    take: opts.limit,
  });
}

/* Posts by a single user, newest first — used on the profile page */
export async function listPostsByUser(
  userId: number,
  opts: { limit: number; offset: number },
): Promise<Post[]> {
  return prisma.post.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: opts.offset,
    take: opts.limit,
  });
}

/* Posts by a set of users (feed) — returns empty array when the set is empty */
export async function listPostsByUserIds(
  userIds: number[],
  opts: { limit: number; offset: number },
): Promise<Post[]> {
  if (userIds.length === 0) return [];
  return prisma.post.findMany({
    where: { userId: { in: userIds } },
    orderBy: { createdAt: "desc" },
    skip: opts.offset,
    take: opts.limit,
  });
}

/* Discover feed: posts sorted by most likes, then newest */
export async function listPostsTrending(opts: { limit: number; offset: number }): Promise<Post[]> {
  return prisma.post.findMany({
    orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
    skip: opts.offset,
    take: opts.limit,
  });
}

export async function countPosts(): Promise<number> {
  return prisma.post.count();
}

export async function countPostsByUser(userId: number): Promise<number> {
  return prisma.post.count({ where: { userId } });
}

export async function countPostsByUserIds(userIds: number[]): Promise<number> {
  if (userIds.length === 0) return 0;
  return prisma.post.count({ where: { userId: { in: userIds } } });
}

/* Insert a new post row */
export async function createPost(data: CreatePostData & { userId: number }): Promise<Post> {
  return prisma.post.create({ data });
}

/* Update mutable fields; returns null if the post no longer exists */
export async function updatePost(
  id: number,
  data: Partial<Pick<Post, "title" | "caption" | "imageUrl" | "cameraId">>,
): Promise<Post | null> {
  try {
    return await prisma.post.update({ where: { id }, data });
  } catch {
    return null;
  }
}

/* Hard-delete a post row (cascades to likes/comments via FK constraints) */
export async function deletePost(id: number): Promise<void> {
  await prisma.post.delete({ where: { id } }).catch(() => undefined);
}
