/* PostCard.tsx — thumbnail card used in the Feed, Discover, and Profile grids.
 * Displays: photo, title, author avatar, like count, comment count.
 * Like/unlike is optimistically applied to ALL relevant query caches so every
 * list that shows this post updates instantly without a network round-trip. */

import { Link } from "wouter";
import type { Post } from "../../api-client";
import { Heart, MessageCircle, Camera as CameraIcon } from "lucide-react";
import { useLikePost, useUnlikePost } from "../../api-client";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListPostsQueryKey,
  getGetFeedQueryKey,
  getGetDiscoverQueryKey,
  getGetUserPostsQueryKey,
  getGetPostQueryKey,
} from "../../api-client";
import { useAuth } from "@/features/auth/context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

/* Staggered entrance animation — each card slides up with a small delay
 * proportional to its index in the grid. */
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 22, delay: i * 0.055 },
  }),
};

export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();
  const isLiked = post.isLiked;

  /* Optimistically toggle the like in every cache that contains this post */
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); /* Don't navigate to the post detail */
    if (!user) return;

    /* Helper: flip isLiked and adjust count for this post in any paginated list */
    const updateList = (oldData: any) => {
      if (!oldData?.posts) return oldData;
      return {
        ...oldData,
        posts: oldData.posts.map((p: Post) =>
          p.id === post.id
            ? { ...p, isLiked: !isLiked, likesCount: p.likesCount + (isLiked ? -1 : 1) }
            : p,
        ),
      };
    };

    /* Apply to all list caches so they stay in sync */
    queryClient.setQueryData(getListPostsQueryKey(), updateList);
    queryClient.setQueryData(getGetFeedQueryKey(), updateList);
    queryClient.setQueryData(getGetDiscoverQueryKey(), updateList);
    queryClient.setQueryData(getGetUserPostsQueryKey(post.userId), updateList);
    /* Also update the single-post detail cache */
    queryClient.setQueryData(getGetPostQueryKey(post.id), (old: any) =>
      old ? { ...old, isLiked: !isLiked, likesCount: old.likesCount + (isLiked ? -1 : 1) } : old,
    );

    try {
      if (isLiked) {
        await unlikeMutation.mutateAsync({ id: post.id });
      } else {
        await likeMutation.mutateAsync({ id: post.id });
      }
    } catch {
      /* On failure, refetch to revert the optimistic update */
      queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
    }
  };

  return (
    <motion.article
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="show"
      className="relative group rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: "var(--pg-surface)" }}
    >
      <Link href={`/post/${post.id}`} className="block">
        {/* Photo — 4:5 aspect ratio, subtle zoom on hover */}
        <div className="w-full aspect-[4/5] overflow-hidden">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
        </div>

        {/* Permanent gradient overlay so the text is always legible */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

        {/* Bottom metadata bar — always visible */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h2 className="font-serif text-sm leading-snug text-white/90 mb-2 line-clamp-1">{post.title}</h2>
          <div className="flex items-center justify-between">
            {/* Author avatar + name */}
            <div className="flex items-center gap-1.5">
              <Avatar className="w-5 h-5 ring-1 ring-white/20">
                <AvatarImage src={post.user.avatarUrl || ""} />
                <AvatarFallback className="bg-white/10 text-[9px] uppercase">
                  {post.user.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] text-white/70 font-medium truncate max-w-[80px]">
                {post.user.name}
              </span>
            </div>

            {/* Like + comment counts; camera badge appears on hover */}
            <div className="flex items-center gap-3">
              {post.camera && (
                <div className="hidden group-hover:flex items-center gap-1 text-white/50">
                  <CameraIcon className="w-2.5 h-2.5" />
                  <span className="font-mono text-[9px] uppercase tracking-wide">{post.camera.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {/* Like button — tap to toggle; heart scales on like */}
                <button
                  onClick={handleLike}
                  className="flex items-center gap-1 active:scale-90 transition-transform"
                >
                  <motion.div animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.25 }}>
                    <Heart
                      className={`w-3.5 h-3.5 ${isLiked ? "fill-red-500 text-red-500" : "text-white/70 fill-white/10"}`}
                      strokeWidth={1.5}
                    />
                  </motion.div>
                  <span className="font-mono text-[10px] text-white/60">{post.likesCount}</span>
                </button>

                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-white/50" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] text-white/50">{post.commentsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
