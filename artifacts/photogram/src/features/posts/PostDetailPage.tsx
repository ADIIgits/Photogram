import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import {
  useGetPost,
  useListComments,
  useCreateComment,
  useLikePost,
  useUnlikePost,
  getGetPostQueryKey,
  getListCommentsQueryKey,
  getGetFeedQueryKey,
  getListPostsQueryKey,
  getGetDiscoverQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/features/auth/context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Heart, MessageCircle, Camera as CameraIcon, Send, ChevronLeft, Share2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export default function PostDetailPage() {
  const [, params] = useRoute("/post/:id");
  const postId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [, navigate] = useLocation();

  const { data: post, isLoading: isPostLoading } = useGetPost(postId, {
    query: { queryKey: getGetPostQueryKey(postId), enabled: !!postId },
  });

  const { data: comments, isLoading: isCommentsLoading } = useListComments(postId, {
    query: { queryKey: getListCommentsQueryKey(postId), enabled: !!postId },
  });

  const createComment = useCreateComment();
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();

  const handleLike = async () => {
    if (!user || !post) return;
    const isLiked = post.isLiked;

    queryClient.setQueryData(getGetPostQueryKey(postId), (old: any) =>
      old ? { ...old, isLiked: !isLiked, likesCount: old.likesCount + (isLiked ? -1 : 1) } : old,
    );

    try {
      if (isLiked) {
        await unlikeMutation.mutateAsync({ id: postId });
      } else {
        await likeMutation.mutateAsync({ id: postId });
      }
      queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDiscoverQueryKey() });
    } catch {
      queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || !post) return;
    try {
      await createComment.mutateAsync({ id: post.id, data: { content: commentText } });
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(postId) });
      queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
    } catch (e) {
      // ignore
    }
  };

  if (isPostLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-6 h-6 animate-spin text-white/20" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <h1 className="font-serif text-2xl mb-3 text-white">Photograph not found</h1>
          <Link href="/" className="text-white/40 hover:text-white text-sm transition-colors">Return to gallery</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] flex flex-col md:flex-row">
      {/* Photo side */}
      <div className="relative md:flex-1 md:h-screen md:sticky md:top-0 bg-black overflow-hidden">
        <motion.img
          initial={{ scale: 1.04, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-full object-cover"
          style={{ maxHeight: "55vh", minHeight: "280px" }}
        />

        {/* Gradient fade at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent pointer-events-none md:hidden" />

        {/* Floating nav buttons */}
        <div className="absolute top-12 inset-x-4 flex justify-between items-center z-10">
          <button
            onClick={() => navigate("~/")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 text-white transition-all active:scale-90 hover:bg-black/50"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <button
            onClick={() => navigator.share?.({ title: post.title, url: window.location.href })}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 text-white transition-all active:scale-90 hover:bg-black/50"
          >
            <Share2 size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Desktop hidden gradient */}
        <div className="hidden md:block absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-[#0a0a0a] pointer-events-none" />
      </div>

      {/* Content side */}
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative md:w-[420px] md:h-screen md:overflow-y-auto flex flex-col -mt-12 md:mt-0 z-10 pb-28 md:pb-8 no-scrollbar"
      >
        <div className="px-5 pt-6 space-y-5">
          {/* Author row */}
          <div className="flex items-center justify-between">
            <Link href={`/profile/${post.user.id}`} className="flex items-center gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-white/10">
                <AvatarImage src={post.user.avatarUrl || ""} />
                <AvatarFallback className="bg-white/8 text-xs uppercase">{post.user.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white leading-tight">{post.user.name}</p>
                <p className="text-xs text-white/40 font-mono">{format(new Date(post.createdAt), "MMM d, yyyy")}</p>
              </div>
            </Link>
          </div>

          {/* Camera badge + title + caption */}
          <div className="space-y-2.5">
            {post.camera && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/[0.06]">
                <CameraIcon className="w-3 h-3 text-white/50" />
                <span className="font-mono text-[10px] tracking-wider text-white/60 uppercase">{post.camera.name}</span>
              </div>
            )}
            <h1 className="font-serif text-2xl font-medium leading-tight text-white">{post.title}</h1>
            {post.caption && (
              <p className="text-sm text-white/55 leading-relaxed">{post.caption}</p>
            )}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-5 pt-1">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 active:scale-90 transition-transform"
            >
              <motion.div animate={{ scale: post.isLiked ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.3 }}>
                <Heart
                  size={22}
                  className={post.isLiked ? "fill-red-500 text-red-500" : "text-white/70"}
                  strokeWidth={1.5}
                />
              </motion.div>
              <span className="font-mono text-xs text-white/50">{post.likesCount}</span>
            </button>
            <div className="flex items-center gap-2">
              <MessageCircle size={22} className="text-white/70" strokeWidth={1.5} />
              <span className="font-mono text-xs text-white/50">{post.commentsCount}</span>
            </div>
          </div>

          <div className="h-px bg-white/[0.06] w-full" />

          {/* Comments */}
          <div className="space-y-4 pb-4">
            <h3 className="font-mono text-[10px] tracking-widest text-white/30 uppercase">
              {post.commentsCount === 1 ? "1 Comment" : `${post.commentsCount} Comments`}
            </h3>

            {isCommentsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white/20 mx-auto" />
            ) : !comments?.length ? (
              <p className="text-xs text-white/25 italic">Silence in the gallery.</p>
            ) : (
              <AnimatePresence>
                {comments.map((comment, i) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className="flex gap-3"
                  >
                    <Link href={`/profile/${comment.user.id}`} className="shrink-0">
                      <Avatar className="w-8 h-8 mt-0.5">
                        <AvatarImage src={comment.user.avatarUrl || ""} />
                        <AvatarFallback className="bg-white/8 text-[10px] uppercase">{comment.user.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${comment.user.id}`} className="text-sm font-medium text-white hover:text-white/80 transition-colors">
                          {comment.user.name}
                        </Link>
                        <span className="text-[10px] text-white/30 font-mono">
                          {formatDistanceToNow(new Date(comment.createdAt))} ago
                        </span>
                      </div>
                      <p className="text-sm text-white/70 leading-snug">{comment.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>

      {/* Floating comment input */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:absolute md:bottom-0 md:left-auto md:w-[420px] md:right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent pt-10">
        {user ? (
          <form onSubmit={handleCommentSubmit}>
            <div className="flex items-center gap-3 px-4 py-3 bg-white/8 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
              <Avatar className="w-6 h-6 shrink-0">
                <AvatarImage src={user.avatarUrl || ""} />
                <AvatarFallback className="bg-white/10 text-[9px] uppercase">{user.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || createComment.isPending}
                className="text-white/40 hover:text-white transition-colors disabled:opacity-30 active:scale-90"
              >
                {createComment.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send size={16} strokeWidth={1.75} />
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-3 px-4 py-3 bg-white/8 rounded-2xl border border-white/10">
            <p className="text-xs text-white/40">
              <Link href="/login" className="text-white/70 underline hover:text-white transition-colors">Sign in</Link>
              {" "}to leave a comment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
