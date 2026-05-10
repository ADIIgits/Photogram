/* models/user.model.ts — raw database access for the User table.
 * All functions are thin Prisma wrappers.
 * toSafeUser strips the passwordHash before any User object leaves the server. */

import { prisma, type User } from "@workspace/db";

export type UserRow = User;
/* SafeUser is the shape sent to the client — never includes the password hash */
export type SafeUser = Omit<User, "passwordHash">;

/* Strip the password hash so it is never accidentally serialised to JSON */
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

/* Create a new user row; email uniqueness is enforced at the DB level */
export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<User> {
  return prisma.user.create({ data });
}

/* Update mutable profile fields; returns null if the user doesn't exist */
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

/* Aggregate post count, follower count, and following count in one query batch */
export async function getUserStats(userId: number) {
  const [postsCount, followersCount, followingCount] = await Promise.all([
    /* Posts this user has published */
    prisma.post.count({ where: { userId } }),
    /* Other users who follow this user */
    prisma.follow.count({ where: { followingId: userId } }),
    /* Users that this user follows */
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { postsCount, followersCount, followingCount };
}
