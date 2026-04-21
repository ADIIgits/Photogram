import { prisma, type User } from "@workspace/db";

export type UserRow = User;
export type SafeUser = Omit<User, "passwordHash">;

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export async function findUserById(id: number): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<User> {
  return prisma.user.create({ data });
}

export async function updateUser(
  id: number,
  data: Partial<Pick<User, "name" | "bio" | "avatarUrl">>,
): Promise<User | null> {
  try {
    return await prisma.user.update({ where: { id }, data });
  } catch {
    return null;
  }
}

export async function getUserStats(userId: number) {
  const [postsCount, followersCount, followingCount] = await Promise.all([
    prisma.post.count({ where: { userId } }),
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { postsCount, followersCount, followingCount };
}
