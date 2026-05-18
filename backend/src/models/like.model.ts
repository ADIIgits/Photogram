import { prisma } from "../db";
import { toSafeUser } from "./user.model";

export async function findLike(postId: number, userId: number) {
  return prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });
}

export async function insertLike(postId: number, userId: number): Promise<void> {
  await prisma.like.create({ data: { postId, userId } }).catch(() => undefined);
}

export async function deleteLike(postId: number, userId: number): Promise<void> {
  await prisma.like
    .delete({ where: { userId_postId: { userId, postId } } })
    .catch(() => undefined);
}

export async function countLikesByPost(postId: number): Promise<number> {
  return prisma.like.count({ where: { postId } });
}

export async function getLikeUsersByPost(postId: number) {
  const rows = await prisma.like.findMany({
    where: { postId },
    include: { user: true },
  });
  return rows.map((r) => toSafeUser(r.user));
}
