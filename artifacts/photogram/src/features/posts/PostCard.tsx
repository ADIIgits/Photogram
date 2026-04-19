import { Link } from "wouter";
import { Post } from "@workspace/api-client-react/src/generated/api.schemas";
import { Heart, MessageCircle, Camera as CameraIcon } from "lucide-react";
import { useLikePost, useUnlikePost } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListPostsQueryKey,
  getGetFeedQueryKey,
  getGetDiscoverQueryKey,
  getGetUserPostsQueryKey,
  getGetPostQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/features/auth/context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();
  const isLiked = post.isLiked;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;

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

    queryClient.setQueryData(getListPostsQueryKey(), updateList);
    queryClient.setQueryData(getGetFeedQueryKey(), updateList);
    queryClient.setQueryData(getGetDiscoverQueryKey(), updateList);
    queryClient.setQueryData(getGetUserPostsQueryKey(post.userId), updateList);
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
      queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
    }
  };

  return (
    <article className="mb-16 border-b border-border/50 pb-12 group last:border-0">
      <header className="flex items-center gap-3 mb-4 px-2 md:px-0">
        <Link href={`/profile/${post.user.id}`}>
          <Avatar className="w-8 h-8 cursor-pointer ring-1 ring-border">
            <AvatarImage src={post.user.avatarUrl || ""} />
            <AvatarFallback className="bg-muted text-xs uppercase">
              {post.user.name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col">
          <Link href={`/profile/${post.user.id}`} className="font-medium text-sm hover:underline cursor-pointer">
            {post.user.name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt))} ago
          </span>
        </div>
      </header>

      <Link href={`/post/${post.id}`} className="block relative overflow-hidden bg-muted/20">
        <div className="w-full aspect-[4/5] md:aspect-auto md:max-h-[80vh] flex items-center justify-center">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-contain md:object-cover md:h-auto max-h-[80vh] transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
      </Link>

      <div className="mt-4 px-2 md:px-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 text-foreground/80 hover:text-foreground transition-colors group/btn"
            >
              <Heart
                className={`w-6 h-6 transition-all ${
                  isLiked ? "fill-destructive text-destructive" : "group-hover/btn:scale-110"
                }`}
              />
              <span className="text-sm font-medium">{post.likesCount}</span>
            </button>
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1.5 text-foreground/80 hover:text-foreground transition-colors group/btn"
            >
              <MessageCircle className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
              <span className="text-sm font-medium">{post.commentsCount}</span>
            </Link>
          </div>
          {post.camera && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono uppercase tracking-wider">
              <CameraIcon className="w-3.5 h-3.5" />
              <span>{post.camera.name}</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h2 className="font-serif text-lg leading-tight text-foreground/90">{post.title}</h2>
          {post.caption && (
            <p className="text-sm text-muted-foreground line-clamp-2">{post.caption}</p>
          )}
        </div>
      </div>
    </article>
  );
}
