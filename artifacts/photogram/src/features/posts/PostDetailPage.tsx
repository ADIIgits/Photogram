import { useState } from "react";
import { useRoute, Link } from "wouter";
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
} from "@workspace/api-client-react";
import { Layout } from "@/components/shared/Layout";
import { useAuth } from "@/features/auth/context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Heart, MessageCircle, Camera as CameraIcon, Send } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function PostDetailPage() {
  const [, params] = useRoute("/post/:id");
  const postId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

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
      console.error(e);
    }
  };

  if (isPostLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="font-serif text-2xl mb-2">Photograph not found</h1>
            <Link href="/" className="text-muted-foreground hover:text-foreground">Return to gallery</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row min-h-screen bg-background">
        <div className="flex-1 bg-black/95 flex items-center justify-center p-4 lg:p-8 min-h-[50vh] lg:min-h-screen sticky top-0">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="max-w-full max-h-[85vh] lg:max-h-screen object-contain"
          />
        </div>

        <div className="w-full lg:w-[400px] border-l border-border bg-card flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Link href={`/profile/${post.user.id}`}>
              <Avatar className="w-10 h-10 ring-1 ring-border cursor-pointer">
                <AvatarImage src={post.user.avatarUrl || ""} />
                <AvatarFallback className="bg-muted text-xs uppercase">
                  {post.user.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex flex-col flex-1 min-w-0">
              <Link href={`/profile/${post.user.id}`} className="font-medium hover:underline truncate">
                {post.user.name}
              </Link>
              <span className="text-xs text-muted-foreground font-mono">
                {format(new Date(post.createdAt), "MMM d, yyyy")}
              </span>
            </div>
            {post.camera && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-mono uppercase tracking-widest shrink-0 ml-2">
                <CameraIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{post.camera.name}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-2">
              <h1 className="font-serif text-xl leading-tight">{post.title}</h1>
              {post.caption && (
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {post.caption}
                </p>
              )}
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
                Exhibition Notes ({post.commentsCount})
              </h3>
              <div className="space-y-5">
                {isCommentsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
                ) : !comments?.length ? (
                  <p className="text-xs text-muted-foreground/60 italic">Silence in the gallery.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 group">
                      <Link href={`/profile/${comment.user.id}`} className="shrink-0 pt-1">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={comment.user.avatarUrl || ""} />
                          <AvatarFallback className="bg-muted text-[10px] uppercase">
                            {comment.user.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <Link href={`/profile/${comment.user.id}`} className="font-medium text-sm hover:underline">
                            {comment.user.name}
                          </Link>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatDistanceToNow(new Date(comment.createdAt))} ago
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 break-words">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border p-4 bg-card mt-auto shrink-0">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 text-foreground/80 hover:text-foreground transition-colors group"
              >
                <Heart
                  className={`w-6 h-6 transition-all ${
                    post.isLiked ? "fill-destructive text-destructive scale-110" : "group-hover:scale-110"
                  }`}
                />
                <span className="font-mono text-sm">{post.likesCount}</span>
              </button>
              <div className="flex items-center gap-1.5 text-foreground/80">
                <MessageCircle className="w-6 h-6" />
                <span className="font-mono text-sm">{post.commentsCount}</span>
              </div>
            </div>

            {user ? (
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Leave a note..."
                  className="bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-border rounded-none text-sm h-10"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="secondary"
                  disabled={!commentText.trim() || createComment.isPending}
                  className="rounded-none h-10 w-10 shrink-0"
                >
                  {createComment.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2 bg-muted/20">
                <Link href="/login" className="underline hover:text-foreground">Sign in</Link> to interact.
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
