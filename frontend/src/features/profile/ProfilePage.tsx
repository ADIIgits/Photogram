/* ProfilePage.tsx — public profile for any user.
 * Shows: blurred avatar as cover banner, avatar, name, bio,
 * follower/following/post stats, and a 3-column photo grid.
 * Own profile hides the Follow button; other users see Follow/Unfollow.
 * Follow state is optimistically updated so the UI responds instantly. */

import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import {
  useGetUser,
  useGetUserPosts,
  useFollowUser,
  useUnfollowUser,
  getGetUserQueryKey,
  getGetUserPostsQueryKey,
  getGetFeedQueryKey,
} from "../../api-client";
import { Layout } from "@/components/shared/Layout";
import { useAuth } from "@/features/auth/context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ArrowLeft, MoreHorizontal, Heart, Image as ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

/* Framer-motion stagger presets */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};
const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.28 } },
};

export default function ProfilePage() {
  /* Extract :id from the route and parse it to a number */
  const [, params] = useRoute("/profile/:id");
  const userId = params?.id ? parseInt(params.id) : 0;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"photos" | "liked">("photos");

  /* Fetch profile metadata (name, bio, stats, isFollowing) */
  const { data: profile, isLoading: isProfileLoading } = useGetUser(userId, {
    query: { queryKey: getGetUserQueryKey(userId), enabled: !!userId },
  });

  /* Fetch this user's posts for the grid */
  const { data: postsData, isLoading: isPostsLoading } = useGetUserPosts(userId, undefined, {
    query: { queryKey: getGetUserPostsQueryKey(userId), enabled: !!userId },
  });

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const isOwnProfile = currentUser?.id === userId;

  /* Optimistic follow/unfollow: mutate cache immediately, then sync with server */
  const handleFollowToggle = async () => {
    if (!profile) return;

    /* Optimistically flip isFollowing and adjust follower count */
    queryClient.setQueryData(getGetUserQueryKey(userId), (old: any) =>
      old
        ? { ...old, isFollowing: !old.isFollowing, followersCount: old.followersCount + (old.isFollowing ? -1 : 1) }
        : old,
    );

    try {
      if (profile.isFollowing) {
        await unfollowMutation.mutateAsync({ id: userId });
      } else {
        await followMutation.mutateAsync({ id: userId });
      }
      /* Refresh feed so newly-followed posts appear */
      queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
    } catch {
      /* Revert optimistic update on failure */
      queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) });
    }
  };

  if (isProfileLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--pg-faint-text)" }} />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="font-serif text-2xl mb-3" style={{ color: "var(--pg-text)" }}>
              Photographer not found
            </h1>
            <Link href="/" className="text-sm transition-colors hover:opacity-70 underline" style={{ color: "var(--pg-muted-text)" }}>
              Return to gallery
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const posts = postsData?.posts ?? [];

  return (
    <Layout>
      <div className="min-h-screen pb-28" style={{ background: "var(--pg-bg)", color: "var(--pg-text)" }}>

        {/* ── Cover banner — blurred, dimmed avatar as background ── */}
        <div className="relative w-full h-[180px] overflow-hidden">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-md brightness-50"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02]" />
          )}
          {/* Gradient fade at bottom so cover bleeds into the page bg */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[var(--pg-bg)]"
            style={{ "--pg-bg": "var(--pg-bg)" } as React.CSSProperties}
          />

          {/* Floating nav pills */}
          <div className="absolute top-12 left-0 right-0 px-4 flex justify-between items-center z-10">
            <button
              onClick={() => navigate("~/")}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 text-white active:scale-90 transition-transform"
            >
              <ArrowLeft size={18} strokeWidth={1.75} />
            </button>
            <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 text-white active:scale-90 transition-transform">
              <MoreHorizontal size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="px-4 pb-4">
          {/* ── Avatar + follow/unfollow action row ── */}
          <div className="flex justify-between items-end relative -mt-9 mb-4">
            <Avatar
              className="w-[72px] h-[72px] border"
              style={{ boxShadow: "0 0 0 2px var(--pg-avatar-ring)", borderColor: "var(--pg-border-strong)" }}
            >
              <AvatarImage src={profile.avatarUrl || ""} className="object-cover" />
              <AvatarFallback
                className="font-serif text-2xl uppercase"
                style={{ background: "var(--pg-surface)", color: "var(--pg-muted-text)" }}
              >
                {profile.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>

            {/* Show follow button only when viewing someone else's profile */}
            {!isOwnProfile && currentUser && (
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  className="px-6 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-95 border"
                  style={
                    profile.isFollowing
                      ? { background: "var(--pg-surface)", borderColor: "var(--pg-border-strong)", color: "var(--pg-text)" }
                      : { background: "var(--pg-btn-bg)", borderColor: "transparent", color: "var(--pg-btn-text)" }
                  }
                >
                  {profile.isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            )}
          </div>

          {/* ── Name & bio ── */}
          <div className="mb-5">
            <h1 className="text-[20px] font-semibold leading-tight" style={{ color: "var(--pg-text)" }}>
              {profile.name}
            </h1>
            {profile.bio && (
              <p className="text-[13px] mt-1 leading-snug" style={{ color: "var(--pg-muted-text)" }}>
                {profile.bio}
              </p>
            )}
          </div>

          {/* ── Stat cards: Posts / Followers / Following ── */}
          <motion.div className="flex gap-2 mb-6" variants={containerVariants} initial="hidden" animate="show">
            {[
              { label: "Posts", value: profile.postsCount },
              { label: "Followers", value: profile.followersCount },
              { label: "Following", value: profile.followingCount },
            ].map(({ label, value }) => (
              <motion.div
                key={label}
                variants={itemVariants}
                className="flex-1 backdrop-blur-md rounded-2xl p-3.5 flex flex-col items-center justify-center border"
                style={{ background: "var(--pg-surface)", borderColor: "var(--pg-border)" }}
              >
                <span className="text-[18px] font-bold tracking-tight" style={{ color: "var(--pg-text)" }}>
                  {value}
                </span>
                <span className="text-[10px] uppercase tracking-wider mt-0.5 font-mono" style={{ color: "var(--pg-muted-text)" }}>
                  {label}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* ── iOS segmented tab (Photos / Liked) ── */}
          <div className="p-1 rounded-full flex mb-5 border" style={{ background: "var(--pg-surface)", borderColor: "var(--pg-border)" }}>
            {(["photos", "liked"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 text-[13px] font-medium rounded-full transition-all duration-200 capitalize"
                style={
                  activeTab === tab
                    ? { background: "var(--pg-btn-bg)", color: "var(--pg-btn-text)" }
                    : { color: "var(--pg-muted-text)" }
                }
              >
                {tab === "photos" ? "Photos" : "Liked"}
              </button>
            ))}
          </div>

          {/* ── 3-column photo grid ── */}
          {isPostsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--pg-faint-text)" }} />
            </div>
          ) : !posts.length ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: "var(--pg-faint-text)" }}>
              <ImageIcon className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-serif text-lg opacity-50">No photographs yet</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-3 gap-[2px] -mx-4"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              key={activeTab}
            >
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  variants={gridItemVariants}
                  className="aspect-square relative overflow-hidden group"
                  style={{ background: "var(--pg-surface)" }}
                >
                  <Link href={`/post/${post.id}`} className="block w-full h-full">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                      loading="lazy"
                    />
                    {/* Like count overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="flex items-center gap-1.5 text-white">
                        <Heart className="w-4 h-4 fill-white" />
                        <span className="font-mono text-xs font-bold">{post.likesCount}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
