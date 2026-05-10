/* HomePage.tsx — the authenticated user's personal feed.
 * Shows posts from photographers they follow, in reverse chronological order.
 * Redirects to /login if not authenticated.
 * Uses a brickwork-style 2-column grid where every 7th post spans full width
 * to create visual rhythm (inspired by magazine layouts). */

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

  /* Feed is only fetched when a user session exists */
  const { data, isLoading } = useGetFeed(undefined, {
    query: {
      queryKey: getGetFeedQueryKey(),
      enabled: !!user,
    },
  });

  /* Show spinner while auth state resolves (avoids flash-of-redirect) */
  if (authLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--pg-faint-text)" }} />
        </div>
      </Layout>
    );
  }

  /* Redirect unauthenticated visitors to the login page */
  if (!user) return <Redirect to="/login" />;

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: "var(--pg-bg)" }}>

        {/* ── Sticky frosted header with current month label ── */}
        <header
          className="sticky top-0 z-30 px-4 pt-4 pb-3 backdrop-blur-xl border-b"
          style={{ background: "var(--pg-bg-frosted)", borderColor: "var(--pg-border)" }}
        >
          <div className="flex items-baseline justify-between max-w-2xl mx-auto">
            <div>
              <h1 className="text-[42px] font-black leading-none tracking-tighter" style={{ color: "var(--pg-text)" }}>
                Feed
              </h1>
              {/* Shows the current month as a subtle timestamp hint */}
              <p className="text-sm font-mono mt-0.5" style={{ color: "var(--pg-muted-text)" }}>
                {format(new Date(), "MMMM yyyy")}
              </p>
            </div>
          </div>
        </header>

        <div className="px-3 pt-4 pb-28 max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--pg-faint-text)" }} />
            </div>
          ) : !data?.posts?.length ? (
            /* Empty state — user hasn't followed anyone yet */
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-32"
            >
              <h2 className="font-serif text-2xl mb-2" style={{ color: "var(--pg-muted-text)" }}>
                The darkroom is empty
              </h2>
              <p className="text-sm" style={{ color: "var(--pg-faint-text)" }}>
                Follow some photographers to see their work.
              </p>
            </motion.div>
          ) : (
            /* 2-column grid; every 7th post (index % 7 === 0) goes full width */
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
