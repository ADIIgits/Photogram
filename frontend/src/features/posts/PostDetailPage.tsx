/* PostDetailPage.tsx — full-detail view of a single photograph.
 * Layout: on mobile, stacked (photo on top, info below); on desktop,
 * a sticky photo panel on the left and a scrollable info panel on the right.
 *
 * Features:
 *   - Fullscreen lightbox (click Expand button)
 *   - Like / unlike with optimistic cache update
 *   - Comment thread with add-comment form
 *   - Native share via Web Share API */

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
import {
  Loader2, Heart, MessageCircle, Camera as CameraIcon,
  Send, ChevronLeft, Share2, Expand, X,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export default function PostDetailPage() {
  const [, params] = useRoute("/post/:id");
  const postId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
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

  /* Optimistic like: update all relevant caches immediately before the API call */
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
      /* Invalidate list views so they reflect the new like count */
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
      /* Refresh comment list and post's commentsCount */
      queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(postId) });
      queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
    } catch {
      /* ignore */
    }
  };

  if (isPostLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--pg-bg)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--pg-faint-text)" }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--pg-bg)" }}>
        <div className="text-center">
          <h1 className="font-serif text-2xl mb-3" style={{ color: "var(--pg-text)" }}>
            Photograph not found
          </h1>
          <Link href="/" className="text-sm transition-colors hover:opacity-70 underline" style={{ color: "var(--pg-muted-text)" }}>
            Return to gallery
          </Link>
        </div>
      </div>
    );
  }

  /* Reusable class for floating icon buttons over the photo */
  const btnCls =
    "flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 text-white transition-all active:scale-90 hover:bg-black/50";

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row md:h-screen md:overflow-hidden"
      style={{ background: "var(--pg-bg)", color: "var(--pg-text)" }}
    >
      {/* ── Fullscreen lightbox overlay ── */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            key="fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onClick={() => setFullscreen(false)}
          >
            <img
              src={post.imageUrl}
              alt={post.title}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={() => setFullscreen(false)} className={`${btnCls} absolute top-10 right-4`}>
              <X size={18} strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Photo panel (left on desktop, top on mobile) ── */}
      <div className="relative h-[58vw] max-h-[55vh] md:h-screen md:max-h-none md:flex-1 md:sticky md:top-0 bg-black overflow-hidden shrink-0">
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-full object-contain"
        />

        {/* Mobile gradient: fades photo into the content panel below */}
        <div
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--pg-bg)] via-transparent to-transparent pointer-events-none md:hidden"
        />

        {/* Floating navigation buttons */}
        <div className="absolute top-10 inset-x-4 flex justify-between items-center z-10">
          <button onClick={() => navigate("~/")} className={btnCls}>
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setFullscreen(true)} className={btnCls}>
              <Expand size={15} strokeWidth={1.75} />
            </button>
            <button
              onClick={() => navigator.share?.({ title: post.title, url: window.location.href })}
              className={btnCls}
            >
              <Share2 size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Info/comments panel (right on desktop, below photo on mobile) ── */}
      <div
        className="flex flex-col md:w-[400px] md:h-screen md:border-l shrink-0 -mt-10 md:mt-0 z-10 relative"
        style={{ borderColor: "var(--pg-border)" }}
      >
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 overflow-y-auto no-scrollbar pb-28 md:pb-24"
        >
          <div className="px-5 pt-6 space-y-5">

            {/* Author row */}
            <div className="flex items-center justify-between">
              <Link href={`/profile/${post.user.id}`} className="flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-2" style={{ ringColor: "var(--pg-border)" }}>
                  <AvatarImage src={post.user.avatarUrl || ""} />
                  <AvatarFallback
                    className="text-xs uppercase"
                    style={{ background: "var(--pg-surface)" }}
                  >
                    {post.user.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-tight" style={{ color: "var(--pg-text)" }}>
                    {post.user.name}
                  </p>
                  <p className="text-xs font-mono" style={{ color: "var(--pg-muted-text)" }}>
                    {format(new Date(post.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </Link>
            </div>

            {/* Camera badge + title + caption */}
            <div className="space-y-2.5">
              {post.camera && (
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border"
                  style={{ background: "var(--pg-surface)", borderColor: "var(--pg-border)" }}
                >
                  <CameraIcon className="w-3 h-3" style={{ color: "var(--pg-muted-text)" }} />
                  <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: "var(--pg-muted-text)" }}>
                    {post.camera.name}
                  </span>
                </div>
              )}
              <h1 className="font-serif text-2xl font-medium leading-tight" style={{ color: "var(--pg-text)" }}>
                {post.title}
              </h1>
              {post.caption && (
                <p className="text-sm leading-relaxed" style={{ color: "var(--pg-muted-text)" }}>
                  {post.caption}
                </p>
              )}
            </div>

            {/* Like + comment count row */}
            <div className="flex items-center gap-5 pt-1">
              <button onClick={handleLike} className="flex items-center gap-2 active:scale-90 transition-transform">
                <motion.div animate={{ scale: post.isLiked ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.3 }}>
                  <Heart
                    size={22}
                    className={post.isLiked ? "fill-red-500 text-red-500" : ""}
                    strokeWidth={1.5}
                    style={{ color: post.isLiked ? undefined : "var(--pg-muted-text)" }}
                  />
                </motion.div>
                <span className="font-mono text-xs" style={{ color: "var(--pg-muted-text)" }}>
                  {post.likesCount}
                </span>
              </button>
              <div className="flex items-center gap-2">
                <MessageCircle size={22} strokeWidth={1.5} style={{ color: "var(--pg-muted-text)" }} />
                <span className="font-mono text-xs" style={{ color: "var(--pg-muted-text)" }}>
                  {post.commentsCount}
                </span>
              </div>
            </div>

            <div className="h-px w-full" style={{ background: "var(--pg-border)" }} />

            {/* Comments section */}
            <div className="space-y-4">
              <h3 className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "var(--pg-faint-text)" }}>
                {post.commentsCount === 1 ? "1 Comment" : `${post.commentsCount} Comments`}
              </h3>

              {isCommentsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" style={{ color: "var(--pg-faint-text)" }} />
              ) : !comments?.length ? (
                <p className="text-xs italic" style={{ color: "var(--pg-faint-text)" }}>
                  Silence in the gallery.
                </p>
              ) : (
                <AnimatePresence>
                  {comments.map((comment, i) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex gap-3"
                    >
                      <Link href={`/profile/${comment.user.id}`} className="shrink-0">
                        <Avatar className="w-8 h-8 mt-0.5">
                          <AvatarImage src={comment.user.avatarUrl || ""} />
                          <AvatarFallback className="text-[10px] uppercase" style={{ background: "var(--pg-surface)" }}>
                            {comment.user.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${comment.user.id}`}
                            className="text-sm font-medium transition-opacity hover:opacity-70"
                            style={{ color: "var(--pg-text)" }}
                          >
                            {comment.user.name}
                          </Link>
                          <span className="text-[10px] font-mono" style={{ color: "var(--pg-faint-text)" }}>
                            {formatDistanceToNow(new Date(comment.createdAt))} ago
                          </span>
                        </div>
                        <p className="text-sm leading-snug" style={{ color: "var(--pg-muted-text)" }}>
                          {comment.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Comment input — sticky at the bottom of the right panel ── */}
        <div
          className="shrink-0 p-4 md:border-t md:static fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl"
          style={{
            background: "var(--pg-bg-frosted)",
            borderColor: "var(--pg-border)",
          }}
        >
          {user ? (
            <form onSubmit={handleCommentSubmit}>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
                style={{ background: "var(--pg-surface-hover)", borderColor: "var(--pg-border-strong)" }}
              >
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarImage src={user.avatarUrl || ""} />
                  <AvatarFallback className="text-[9px] uppercase" style={{ background: "var(--pg-surface)" }}>
                    {user.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  style={{ color: "var(--pg-text)" }}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || createComment.isPending}
                  className="transition-opacity disabled:opacity-30 active:scale-90"
                  style={{ color: "var(--pg-muted-text)" }}
                >
                  {createComment.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send size={16} strokeWidth={1.75} />
                  }
                </button>
              </div>
            </form>
          ) : (
            <div
              className="flex items-center justify-center px-4 py-3 rounded-2xl border"
              style={{ background: "var(--pg-surface)", borderColor: "var(--pg-border)" }}
            >
              <p className="text-xs" style={{ color: "var(--pg-muted-text)" }}>
                <Link href="/login" className="underline hover:opacity-70 transition-opacity" style={{ color: "var(--pg-text)" }}>
                  Sign in
                </Link>
                {" "}to leave a comment
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
