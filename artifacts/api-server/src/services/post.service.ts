import {
  findPostById,
  listPosts,
  listPostsByUser,
  listPostsByUserIds,
  listPostsTrending,
  countPosts,
  countPostsByUser,
  countPostsByUserIds,
  createPost,
  updatePost,
  deletePost,
  type PostRow,
} from "../models/post.model";
import { findUserById, toSafeUser } from "../models/user.model";
import { findCameraById } from "../models/camera.model";
import { countLikesByPost, findLike } from "../models/like.model";
import { db, commentsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

async function countCommentsByPost(postId: number): Promise<number> {
  const [r] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(commentsTable)
    .where(eq(commentsTable.postId, postId));
  return r?.count ?? 0;
}

export async function buildPostView(post: PostRow, currentUserId?: number) {
  const user = await findUserById(post.userId);
  const camera = post.cameraId ? await findCameraById(post.cameraId) : null;
  const likesCount = await countLikesByPost(post.id);
  const commentsCount = await countCommentsByPost(post.id);
  const isLiked = currentUserId ? !!(await findLike(post.id, currentUserId)) : false;

  return {
    ...post,
    user: user ? toSafeUser(user) : null,
    camera: camera ?? null,
    likesCount,
    commentsCount,
    isLiked,
  };
}

export async function getPost(postId: number, currentUserId?: number) {
  const post = await findPostById(postId);
  if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });
  return buildPostView(post, currentUserId);
}

export async function getPosts(page: number, limit: number, currentUserId?: number) {
  const offset = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    listPosts({ limit, offset }),
    countPosts(),
  ]);
  const enriched = await Promise.all(posts.map((p) => buildPostView(p, currentUserId)));
  return { posts: enriched, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getUserPosts(
  userId: number,
  page: number,
  limit: number,
  currentUserId?: number,
) {
  const offset = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    listPostsByUser(userId, { limit, offset }),
    countPostsByUser(userId),
  ]);
  const enriched = await Promise.all(posts.map((p) => buildPostView(p, currentUserId)));
  return { posts: enriched, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getFeedPosts(
  userId: number,
  followingIds: number[],
  page: number,
  limit: number,
) {
  const userIds = [...followingIds, userId];
  if (userIds.length === 0) return { posts: [], total: 0, page, totalPages: 0 };

  const offset = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    listPostsByUserIds(userIds, { limit, offset }),
    countPostsByUserIds(userIds),
  ]);
  const enriched = await Promise.all(posts.map((p) => buildPostView(p, userId)));
  return { posts: enriched, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getDiscoverPosts(page: number, limit: number, currentUserId?: number) {
  const offset = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    listPostsTrending({ limit, offset }),
    countPosts(),
  ]);
  const enriched = await Promise.all(posts.map((p) => buildPostView(p, currentUserId)));
  return { posts: enriched, total, page, totalPages: Math.ceil(total / limit) };
}

export async function addPost(
  userId: number,
  data: { title: string; imageUrl: string; caption?: string; cameraId?: number | null },
  currentUserId?: number,
) {
  const post = await createPost({ ...data, userId });
  return buildPostView(post, currentUserId);
}

export async function editPost(
  postId: number,
  requesterId: number,
  data: Partial<{ title: string; caption: string; imageUrl: string; cameraId: number | null }>,
) {
  const post = await findPostById(postId);
  if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });
  if (post.userId !== requesterId) throw Object.assign(new Error("Forbidden"), { status: 403 });

  const updated = await updatePost(postId, data);
  return updated ? buildPostView(updated, requesterId) : null;
}

export async function removePost(postId: number, requesterId: number) {
  const post = await findPostById(postId);
  if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });
  if (post.userId !== requesterId) throw Object.assign(new Error("Forbidden"), { status: 403 });
  await deletePost(postId);
}
