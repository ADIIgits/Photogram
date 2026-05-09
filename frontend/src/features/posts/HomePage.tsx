import { useGetFeed, getGetFeedQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/shared/Layout";
import { PostCard } from "./PostCard";
import { useAuth } from "@/features/auth/context";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();

  const { data, isLoading } = useGetFeed(undefined, {
    query: {
      queryKey: getGetFeedQueryKey(),
      enabled: !!user,
    },
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-white/30" />
        </div>
      </Layout>
    );
  }

  if (!user) return <Redirect to="/login" />;

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Sticky header */}
        <header className="sticky top-0 z-30 px-4 pt-4 pb-3 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="flex items-baseline justify-between max-w-2xl mx-auto">
            <div>
              <h1 className="text-[42px] font-black leading-none tracking-tighter text-white">Feed</h1>
              <p className="text-white/35 text-sm font-mono mt-0.5">{format(new Date(), "MMMM yyyy")}</p>
            </div>
          </div>
        </header>

        <div className="px-3 pt-4 pb-28 max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-6 h-6 animate-spin text-white/20" />
            </div>
          ) : !data?.posts?.length ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-32"
            >
              <h2 className="font-serif text-2xl mb-2 text-white/50">The darkroom is empty</h2>
              <p className="text-white/30 text-sm">Follow some photographers to see their work.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {data.posts.map((post, i) => {
                const isWide = i % 7 === 0;
                return (
                  <div key={post.id} className={isWide ? "col-span-2" : "col-span-1"}>
                    <PostCard post={post} index={i} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
