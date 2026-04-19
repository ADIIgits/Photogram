import { useGetFeed, getGetFeedQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/shared/Layout";
import { PostCard } from "./PostCard";
import { useAuth } from "@/features/auth/context";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();

  const { data, isLoading } = useGetFeed({
    query: {
      queryKey: getGetFeedQueryKey(),
      enabled: !!user,
    },
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!user) return <Redirect to="/login" />;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pt-6 md:pt-12 px-0 md:px-6 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.posts?.length ? (
          <div className="text-center py-32 border border-border/50 border-dashed m-4">
            <h2 className="font-serif text-2xl mb-2 text-foreground/80">The darkroom is empty</h2>
            <p className="text-muted-foreground mb-6">Follow some photographers to see their work.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {data.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
