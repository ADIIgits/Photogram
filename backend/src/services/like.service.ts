import { findLike, insertLike, deleteLike, countLikesByPost, getLikeUsersByPost } from "../models/like.model";
import { findPostById } from "../models/post.model";

export async function likePost(postId: number, userId: number) {
  const post = await findPostById(postId);
  if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });

  const existing = await findLike(postId, userId);
  if (existing) throw Object.assign(new Error("Already liked"), { status: 409 });

  await insertLike(postId, userId);
  return { message: "Post liked" };
}

export async function unlikePost(postId: number, userId: number) {
  await deleteLike(postId, userId);
  return { message: "Post unliked" };
}

export async function getPostLikes(postId: number) {
  const [count, users] = await Promise.all([
    countLikesByPost(postId),
    getLikeUsersByPost(postId),
  ]);
  return { count, users };
}
