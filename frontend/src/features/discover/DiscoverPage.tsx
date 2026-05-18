/* DiscoverPage.tsx — browsable photo feed with search and tab filtering.
 * 
 * Layout:
 *   - Sticky frosted header with title + search toggle button
 *   - Expandable search bar (fades in/out — no overflow-hidden so the
 *     suggestion dropdown is never clipped by the container)
 *   - iOS-style segmented tab control (Trending / Recent / Following)
 *   - Hero card for the top post, horizontal category strip, then 2-col grid */

import { useMemo, useState } from "react";
import { useSearch, Link } from "wouter";
import { useGetDiscover, getGetDiscoverQueryKey } from "../../api-client";
import { Layout } from "@/components/shared/Layout";
import { Loader2, Heart, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from "@/features/search/SearchBar";

const TABS = ["Trending", "Recent", "Following"] as const;

/* Framer-motion stagger variants for the post grid */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function DiscoverPage() {
  /* Parse ?q= from the URL to pre-populate the search filter */
  const search = useSearch();
  const query = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get("q")?.trim() ?? "";
  }, [search]);

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Trending");
  const [showSearch, setShowSearch] = useState(false);

  /* Fetch all discover posts; client-side filter by query string */
  const { data, isLoading } = useGetDiscover(undefined, {
    query: { queryKey: getGetDiscoverQueryKey() },
  });

  const allPosts = useMemo(() => data?.posts ?? [], [data]);

  /* Filter posts locally by title, caption, or author name */
  const filteredPosts = useMemo(() => {
    if (!allPosts.length) return [];
    if (!query) return allPosts;
    const q = query.toLowerCase();
    return allPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.caption?.toLowerCase().includes(q) ?? false) ||
        p.user.name.toLowerCase().includes(q),
    );
  }, [allPosts, query]);

  /* First 3 posts drive the hero + category strip; rest fill the grid */
  const heroPosts = filteredPosts.slice(0, 3);
  const gridPosts = filteredPosts.slice(1);

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: "var(--pg-bg)", color: "var(--pg-text)" }}>

        {/* ── Sticky frosted header ── */}
        <header
          className="sticky top-0 z-30 px-4 pt-4 pb-3 backdrop-blur-xl border-b flex items-center justify-between"
          style={{ background: "var(--pg-bg-frosted)", borderColor: "var(--pg-border)" }}
        >
          <h1 className="text-[42px] font-black leading-none tracking-tighter" style={{ color: "var(--pg-text)" }}>
            Discover
          </h1>
          <button
            onClick={() => setShowSearch((v) => !v)}
            className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors active:scale-90"
            style={{
              background: "var(--pg-surface)",
              borderColor: "var(--pg-border-strong)",
              color: "var(--pg-muted-text)",
            }}
          >
            <Search className="w-4 h-4" />
          </button>
        </header>

        {/* ── Expandable search panel ──────────────────────────────────────────
            IMPORTANT: this wrapper intentionally has NO overflow-hidden.
            overflow-hidden would clip the absolutely-positioned suggestion
            dropdown that SearchBar renders below its input field.
            We animate with opacity + translateY instead of height so the
            container never needs to clip its children. */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              key="search-panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative px-4 pt-3 pb-1 border-b z-40"
              style={{ borderColor: "var(--pg-border)" }}
            >
              <SearchBar />
              {query && (
                <p className="mt-2 mb-1 text-xs font-mono" style={{ color: "var(--pg-faint-text)" }}>
                  Showing results for{" "}
                  <span style={{ color: "var(--pg-muted-text)" }}>&ldquo;{query}&rdquo;</span>
                  {" · "}
                  <Link href="/discover" className="underline hover:opacity-70 transition-opacity">
                    clear
                  </Link>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pb-28 no-scrollbar">
          {/* ── iOS pill segmented tab control ── */}
          <div className="px-4 pt-4 pb-3">
            <div
              className="flex p-1 rounded-full border relative isolate"
              style={{ background: "var(--pg-surface)", borderColor: "var(--pg-border)" }}
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 relative z-10 py-2 text-sm font-medium transition-colors duration-200"
                    style={{ color: isActive ? "var(--pg-bg)" : "var(--pg-muted-text)" }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="discover-tab-bg"
                        className="absolute inset-0 rounded-full shadow-md"
                        style={{ background: "var(--pg-text)", zIndex: -1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Content area ── */}
          {isLoading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--pg-faint-text)" }} />
            </div>
          ) : !filteredPosts.length ? (
            <div className="text-center py-32">
              <p className="text-sm" style={{ color: "var(--pg-faint-text)" }}>
                {query ? "No photographs match this search." : "Nothing to discover yet."}
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
              key={activeTab}
            >
              {/* ── Featured hero — largest card, first post ── */}
              {heroPosts[0] && (
                <motion.div variants={itemVariants} className="px-4">
                  <Link href={`/post/${heroPosts[0].id}`}>
                    <div
                      className="relative h-[220px] rounded-3xl overflow-hidden group cursor-pointer border"
                      style={{ borderColor: "var(--pg-border)" }}
                    >
                      <img
                        src={heroPosts[0].imageUrl}
                        alt={heroPosts[0].title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute top-4 left-4">
                        <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                          <span className="font-mono text-[10px] tracking-widest text-white/80 uppercase">
                            Editor's Pick
                          </span>
                        </div>
                      </div>

                      <div className="absolute bottom-0 inset-x-0 p-5">
                        <h2 className="font-serif text-2xl font-bold text-white leading-tight mb-2">
                          {heroPosts[0].title}
                        </h2>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 bg-white/10">
                              {heroPosts[0].user.avatarUrl && (
                                <img src={heroPosts[0].user.avatarUrl} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-white/80">{heroPosts[0].user.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/70">
                            <Heart className="w-4 h-4 fill-white/70" />
                            <span className="font-mono text-xs font-bold">{heroPosts[0].likesCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* ── Trending category horizontal strip (posts 2 & 3) ── */}
              {heroPosts.length > 1 && (
                <motion.div variants={itemVariants} className="space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] px-4" style={{ color: "var(--pg-faint-text)" }}>
                    Trending Now
                  </p>
                  <div className="flex gap-3 px-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
                    {heroPosts.slice(1).map((post) => (
                      <Link key={post.id} href={`/post/${post.id}`}>
                        <div
                          className="relative flex-none w-[140px] h-[72px] rounded-2xl overflow-hidden snap-start cursor-pointer group border"
                          style={{ borderColor: "var(--pg-border)" }}
                        >
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/45 transition-all group-hover:bg-black/25" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-serif font-bold text-sm tracking-wide text-white line-clamp-1 px-2 text-center">
                              {post.title}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── 2-column masonry-style grid for the rest of the posts ── */}
              {gridPosts.length > 0 && (
                <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 px-4">
                  {gridPosts.map((post) => (
                    <motion.div
                      key={post.id}
                      variants={itemVariants}
                      className="relative aspect-[4/5] rounded-2xl overflow-hidden group cursor-pointer border"
                      style={{ borderColor: "var(--pg-border)" }}
                    >
                      <Link href={`/post/${post.id}`} className="block w-full h-full">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <h4 className="font-serif font-bold text-sm text-white mb-1 line-clamp-1">{post.title}</h4>
                          <div className="flex items-center gap-1.5 text-white/55">
                            <Heart className="w-3 h-3" strokeWidth={1.5} />
                            <span className="font-mono text-[10px]">{post.likesCount}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
