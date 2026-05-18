import { prisma } from "../db";

export async function findFollow(followerId: number, followingId: number) {
  return prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
}

export async function insertFollow(followerId: number, followingId: number): Promise<void> {
  await prisma.follow
    .create({ data: { followerId, followingId } })
    .catch(() => undefined);
}

export async function deleteFollow(followerId: number, followingId: number): Promise<void> {
  await prisma.follow
    .delete({ where: { followerId_followingId: { followerId, followingId } } })
    .catch(() => undefined);
}

export async function getFollowingIds(userId: number): Promise<number[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return rows.map((r) => r.followingId);
}
