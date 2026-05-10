/* services/post.service.ts — post business logic.
 *
 * buildPostView  — enriches a raw Post DB row with author info, camera details,
 *   like count, comment count, and whether the current viewer has liked it.
 *   Called by every function that returns a post to the client.
 *
 * getPost        — fetch a single post by ID.
 * getPosts       — paginated list of all posts (latest first).
 * getUserPosts   — paginated posts by a specific user.
 * getFeedPosts   — paginated posts by users the viewer follows (+ their own).
 * getDiscoverPosts — trending posts sorted by like count then recency.
 * addPost        — create a new post for the authenticated user.
 * editPost       — update a post (ownership verified).
 * removePost     — delete a post (ownership verified). */

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
import { prisma } from "@workspace/db";

/* Count comments for a post — kept local to this service to avoid a circular import */
async function countCommentsByPost(postId: number): Promise<number> {
  return prisma.comment.count({ where: { postId } });
}

/* Hydrate a raw PostRow with all the data the client needs.
 * Runs several DB queries in parallel where possible. */
export async function buildPostView(post: PostRow, currentUserId?: number) {
  const user = await findUserById(post.userId);
  const camera = post.cameraId ? await findCameraById(post.cameraId) : null;
  const likesCount = await countLikesByPost(post.id);
  const commentsCount = await countCommentsByPost(post.id);
  /* isLiked is false for unauthenticated viewers */
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

/* GET /posts/:id */
export async function getPost(postId: number, currentUserId?: number) {
  const post = await findPostById(postId);
  if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });
  return buildPostView(post, currentUserId);
}

/* GET /posts — all posts, newest first */
export async function getPosts(page: number, limit: number, currentUserId?: number) {
  const offset = (page - 1) * limit;
  const [posts, total] = await Promise.all([listPosts({ limit, offset }), countPosts()]);
  const enriched = await Promise.all(posts.map((p) => buildPostView(p, currentUserId)));
  return { posts: enriched, total, page, totalPages: Math.ceil(total / limit) };
}

/* GET /users/:id/posts */
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

/* GET /feed — posts from accounts the user follows (plus their own) */
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

/* GET /discover — trending posts (most liked, then newest) */
export async function getDiscoverPosts(page: number, limit: number, currentUserId?: number) {
  const offset = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    listPostsTrending({ limit, offset }),
    countPosts(),
  ]);
  const enriched = await Promise.all(posts.map((p) => buildPostView(p, currentUserId)));
  return { posts: enriched, total, page, totalPages: Math.ceil(total / limit) };
}

/* POST /posts — create a new post */
export async function addPost(
  userId: number,
  data: { title: string; imageUrl: string; caption?: string | null; cameraId?: number | null },
  currentUserId?: number,
) {
  const post = await createPost({ ...data, userId });
  return buildPostView(post, currentUserId);
}

/* PATCH /posts/:id — update title / caption / imageUrl (requester must own it) */
export async function editPost(
  postId: number,
  requesterId: number,
  data: Partial<{ title: string; caption: string | null; imageUrl: string; cameraId: number | null }>,
) {
  const post = await findPostById(postId);
  if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });
  if (post.userId !== requesterId) throw Object.assign(new Error("Forbidden"), { status: 403 });

  const updated = await updatePost(postId, data);
  return updated ? buildPostView(updated, requesterId) : null;
}

/* DELETE /posts/:id — remove a post (requester must own it) */
export async function removePost(postId: number, requesterId: number) {
  const post = await findPostById(postId);
  if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });
  if (post.userId !== requesterId) throw Object.assign(new Error("Forbidden"), { status: 403 });
  await deletePost(postId);
}
