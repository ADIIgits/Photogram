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
} from "@workspace/api-client-react";
import { Layout } from "@/components/shared/Layout";
import { useAuth } from "@/features/auth/context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ArrowLeft, MoreHorizontal, Heart, Image as ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

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
  const [, params] = useRoute("/profile/:id");
  const userId = params?.id ? parseInt(params.id) : 0;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"photos" | "liked">("photos");

  const { data: profile, isLoading: isProfileLoading } = useGetUser(userId, {
    query: { queryKey: getGetUserQueryKey(userId), enabled: !!userId },
  });

  const { data: postsData, isLoading: isPostsLoading } = useGetUserPosts(userId, undefined, {
    query: { queryKey: getGetUserPostsQueryKey(userId), enabled: !!userId },
  });

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const isOwnProfile = currentUser?.id === userId;

  const handleFollowToggle = async () => {
    if (!profile) return;

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
      queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
    } catch {
      queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) });
    }
  };

  if (isProfileLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-white/20" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="font-serif text-2xl mb-3 text-white">Photographer not found</h1>
            <Link href="/" className="text-white/40 hover:text-white text-sm transition-colors">Return to gallery</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const posts = postsData?.posts ?? [];

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-28">
        {/* Cover image area */}
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0a0a0a]" />

          {/* Nav pills */}
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
          {/* Avatar & action row */}
          <div className="flex justify-between items-end relative -mt-9 mb-4">
            <Avatar className="w-[72px] h-[72px] ring-2 ring-[#0a0a0a] border border-white/20">
              <AvatarImage src={profile.avatarUrl || ""} className="object-cover" />
              <AvatarFallback className="bg-white/8 font-serif text-2xl uppercase text-white/60">
                {profile.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>

            {!isOwnProfile && currentUser && (
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  className={`px-6 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-95 ${
                    profile.isFollowing
                      ? "bg-white/10 border border-white/15 text-white"
                      : "bg-white text-black hover:bg-white/90"
                  }`}
                >
                  {profile.isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            )}
          </div>

          {/* Name & bio */}
          <div className="mb-5">
            <h1 className="text-[20px] font-semibold leading-tight">{profile.name}</h1>
            {profile.bio && (
              <p className="text-white/50 text-[13px] mt-1 leading-snug">{profile.bio}</p>
            )}
          </div>

          {/* Stats */}
          <motion.div
            className="flex gap-2 mb-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {[
              { label: "Posts", value: profile.postsCount },
              { label: "Followers", value: profile.followersCount },
              { label: "Following", value: profile.followingCount },
            ].map(({ label, value }) => (
              <motion.div
                key={label}
                variants={itemVariants}
                className="flex-1 bg-white/[0.05] backdrop-blur-md rounded-2xl p-3.5 flex flex-col items-center justify-center border border-white/[0.05]"
              >
                <span className="text-[18px] font-bold tracking-tight">{value}</span>
                <span className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 font-mono">{label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* iOS segmented control */}
          <div className="bg-white/[0.06] p-1 rounded-full flex mb-5">
            <button
              onClick={() => setActiveTab("photos")}
              className={`flex-1 py-2 text-[13px] font-medium rounded-full transition-all duration-200 ${
                activeTab === "photos" ? "bg-white text-black shadow-sm" : "text-white/50 hover:text-white/80"
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setActiveTab("liked")}
              className={`flex-1 py-2 text-[13px] font-medium rounded-full transition-all duration-200 ${
                activeTab === "liked" ? "bg-white text-black shadow-sm" : "text-white/50 hover:text-white/80"
              }`}
            >
              Liked
            </button>
          </div>

          {/* Photo grid */}
          {isPostsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-white/20" />
            </div>
          ) : !posts.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/20">
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
                  className="aspect-square bg-white/5 relative overflow-hidden group"
                >
                  <Link href={`/post/${post.id}`} className="block w-full h-full">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                      loading="lazy"
                    />
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
