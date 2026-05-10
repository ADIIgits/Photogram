/* services/user.service.ts — user profile and follow/unfollow logic.
 *
 * getUser      — fetch a public profile by ID, including post/follow stats
 *                and whether the current viewer is already following them.
 * editUser     — update a user's display name, bio, or avatar URL.
 *                Only the user themselves may edit their own profile.
 * followUser   — create a follow relationship between two users.
 * unfollowUser — remove a follow relationship. */

import {
  findUserById,
  updateUser,
  getUserStats,
  toSafeUser,
} from "../models/user.model";
import { findFollow, insertFollow, deleteFollow } from "../models/follow.model";

/* Returns the full public profile for a given user ID.
 * Includes post count, follower/following counts, and isFollowing flag. */
export async function getUser(userId: number, currentUserId?: number) {
  const user = await findUserById(userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const stats = await getUserStats(userId);
  /* isFollowing is only meaningful when a logged-in user is viewing */
  const isFollowing = currentUserId
    ? !!(await findFollow(currentUserId, userId))
    : false;

  return { ...toSafeUser(user), ...stats, isFollowing };
}

/* Updates profile fields for a user.
 * Throws 403 if the requester is not the profile owner. */
export async function editUser(
  userId: number,
  requesterId: number,
  data: Partial<{ name: string; bio: string | null; avatarUrl: string | null }>,
) {
  if (userId !== requesterId) throw Object.assign(new Error("Forbidden"), { status: 403 });
  const updated = await updateUser(userId, data);
  if (!updated) throw Object.assign(new Error("User not found"), { status: 404 });
  return toSafeUser(updated);
}

/* Create a follow relationship. Users cannot follow themselves. */
export async function followUser(followerId: number, targetId: number) {
  if (followerId === targetId) {
    throw Object.assign(new Error("Cannot follow yourself"), { status: 400 });
  }
  const target = await findUserById(targetId);
  if (!target) throw Object.assign(new Error("User not found"), { status: 404 });
  await insertFollow(followerId, targetId);
  return { message: "Followed successfully" };
}

/* Remove a follow relationship (idempotent — safe to call even if not following) */
export async function unfollowUser(followerId: number, targetId: number) {
  await deleteFollow(followerId, targetId);
  return { message: "Unfollowed successfully" };
}
