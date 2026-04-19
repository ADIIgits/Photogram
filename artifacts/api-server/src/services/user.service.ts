import {
  findUserById,
  updateUser,
  getUserStats,
  toSafeUser,
} from "../models/user.model";
import { findFollow, insertFollow, deleteFollow } from "../models/follow.model";

export async function getUser(userId: number, currentUserId?: number) {
  const user = await findUserById(userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const stats = await getUserStats(userId);
  const isFollowing = currentUserId
    ? !!(await findFollow(currentUserId, userId))
    : false;

  return { ...toSafeUser(user), ...stats, isFollowing };
}

export async function editUser(
  userId: number,
  requesterId: number,
  data: Partial<{ name: string; bio: string; avatarUrl: string }>,
) {
  if (userId !== requesterId) throw Object.assign(new Error("Forbidden"), { status: 403 });
  const updated = await updateUser(userId, data);
  if (!updated) throw Object.assign(new Error("User not found"), { status: 404 });
  return toSafeUser(updated);
}

export async function followUser(followerId: number, targetId: number) {
  if (followerId === targetId) {
    throw Object.assign(new Error("Cannot follow yourself"), { status: 400 });
  }
  const target = await findUserById(targetId);
  if (!target) throw Object.assign(new Error("User not found"), { status: 404 });
  await insertFollow(followerId, targetId);
  return { message: "Followed successfully" };
}

export async function unfollowUser(followerId: number, targetId: number) {
  await deleteFollow(followerId, targetId);
  return { message: "Unfollowed successfully" };
}
