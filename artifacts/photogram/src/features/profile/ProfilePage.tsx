import { useRoute, Link } from "wouter";
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
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Grid3X3, Image as ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:id");
  const userId = params?.id ? parseInt(params.id) : 0;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

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
        ? {
            ...old,
            isFollowing: !old.isFollowing,
            followersCount: old.followersCount + (old.isFollowing ? -1 : 1),
          }
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
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="font-serif text-2xl mb-2">Photographer not found</h1>
            <Link href="/" className="text-muted-foreground hover:text-foreground">Return to gallery</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto pt-6 md:pt-12 px-4 md:px-8 pb-24">
        <header className="mb-16 md:mb-24">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16">
            <Avatar className="w-32 h-32 md:w-48 md:h-48 ring-1 ring-border shrink-0">
              <AvatarImage src={profile.avatarUrl || ""} className="object-cover" />
              <AvatarFallback className="bg-muted text-4xl uppercase font-serif text-muted-foreground">
                {profile.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6 w-full md:w-auto">
                <h1 className="font-serif text-3xl md:text-4xl leading-none">{profile.name}</h1>
                {!isOwnProfile && currentUser && (
                  <Button
                    variant={profile.isFollowing ? "outline" : "default"}
                    onClick={handleFollowToggle}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className="w-full md:w-auto min-w-[120px] rounded-none uppercase tracking-widest text-xs"
                  >
                    {profile.isFollowing ? "Following" : "Follow"}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-8 mb-6 font-mono text-sm tracking-wide">
                {[
                  { label: "Posts", value: profile.postsCount },
                  { label: "Followers", value: profile.followersCount },
                  { label: "Following", value: profile.followingCount },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center md:items-start">
                    <span className="text-foreground font-medium text-lg">{value}</span>
                    <span className="text-muted-foreground uppercase text-xs">{label}</span>
                  </div>
                ))}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground max-w-lg leading-relaxed text-sm">{profile.bio}</p>
              )}
            </div>
          </div>
        </header>

        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-center gap-2 mb-8 text-muted-foreground">
            <Grid3X3 className="w-4 h-4" />
            <span className="text-sm font-medium tracking-widest uppercase">Portfolio</span>
          </div>

          {isPostsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !postsData?.posts?.length ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-serif text-xl opacity-50">No photographs yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 md:gap-4">
              {postsData.posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="aspect-square relative group overflow-hidden bg-muted/20 block"
                >
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex items-center gap-6 text-white font-medium">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 fill-white text-white" />
                        <span>{post.likesCount}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
