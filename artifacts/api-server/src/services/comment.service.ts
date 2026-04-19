import {
  findCommentsByPost,
  findCommentById,
  createComment,
  deleteComment,
} from "../models/comment.model";
import { findPostById } from "../models/post.model";
import { findUserById, toSafeUser } from "../models/user.model";

export async function listComments(postId: number) {
  return findCommentsByPost(postId);
}

export async function addComment(postId: number, userId: number, content: string) {
  const post = await findPostById(postId);
  if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });

  const comment = await createComment({ content, postId, userId });
  const user = await findUserById(userId);

  return { ...comment, user: user ? toSafeUser(user) : null };
}

export async function removeComment(commentId: number, requesterId: number) {
  const comment = await findCommentById(commentId);
  if (!comment) throw Object.assign(new Error("Comment not found"), { status: 404 });
  if (comment.userId !== requesterId) throw Object.assign(new Error("Forbidden"), { status: 403 });
  await deleteComment(commentId);
}
