import { prisma, type Comment } from "../db";
import { toSafeUser } from "./user.model";

export type CommentRow = Comment;

export async function findCommentsByPost(postId: number) {
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });
  return comments.map((c) => ({ ...c, user: c.user ? toSafeUser(c.user) : null }));
}

export async function findCommentById(id: number): Promise<Comment | null> {
  return prisma.comment.findUnique({ where: { id } });
}

export async function createComment(data: {
  content: string;
  postId: number;
  userId: number;
}): Promise<Comment> {
  return prisma.comment.create({ data });
}

export async function deleteComment(id: number): Promise<void> {
  await prisma.comment.delete({ where: { id } }).catch(() => undefined);
}
