import { useMemo, useState } from "react";
import { useSearch, Link } from "wouter";
import { useGetDiscover, getGetDiscoverQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/shared/Layout";
import { Loader2, Heart, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from "@/features/search/SearchBar";

const TABS = ["Trending", "Recent", "Following"] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function DiscoverPage() {
  const search = useSearch();
  const query = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get("q")?.trim() ?? "";
  }, [search]);

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Trending");
  const [showSearch, setShowSearch] = useState(false);

  const { data, isLoading } = useGetDiscover(undefined, {
    query: { queryKey: getGetDiscoverQueryKey() },
  });

  const allPosts = useMemo(() => data?.posts ?? [], [data]);

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

  const heroPosts = filteredPosts.slice(0, 3);
  const gridPosts = filteredPosts.slice(1);

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Frosted navbar */}
        <header className="sticky top-0 z-30 px-4 pt-4 pb-3 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between">
          <h1 className="text-[42px] font-black leading-none tracking-tighter">Discover</h1>
          <button
            onClick={() => setShowSearch((v) => !v)}
            className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors active:scale-90"
          >
            <Search className="w-4 h-4 text-white/70" />
          </button>
        </header>

        {/* Search bar (expandable) */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden px-4 pt-3 pb-1 border-b border-white/[0.06]"
            >
              <SearchBar />
              {query && (
                <p className="mt-2 mb-1 text-xs text-white/40 font-mono">
                  Showing results for <span className="text-white/70">&ldquo;{query}&rdquo;</span>
                  {" · "}
                  <Link href="/discover" className="underline hover:text-white/70 transition-colors">clear</Link>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pb-28 no-scrollbar">
          {/* iOS pill filter tabs */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex p-1 bg-white/[0.05] rounded-full border border-white/[0.05] relative isolate">
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 relative z-10 py-2 text-sm font-medium transition-colors duration-200 ${
                      isActive ? "text-black" : "text-white/50 hover:text-white/80"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="discover-tab-bg"
                        className="absolute inset-0 bg-white rounded-full shadow-md"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-6 h-6 animate-spin text-white/20" />
            </div>
          ) : !filteredPosts.length ? (
            <div className="text-center py-32">
              <p className="text-white/30 text-sm">
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
              {/* Featured hero — first post */}
              {heroPosts[0] && (
                <motion.div variants={itemVariants} className="px-4">
                  <Link href={`/post/${heroPosts[0].id}`}>
                    <div className="relative h-[220px] rounded-3xl overflow-hidden group cursor-pointer border border-white/[0.07]">
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
                        <h2 className="font-serif text-2xl font-bold text-white leading-tight mb-2">{heroPosts[0].title}</h2>
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

              {/* Trending category pills (first few posts used as category images) */}
              {heroPosts.length > 1 && (
                <motion.div variants={itemVariants} className="space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30 px-4">Trending Now</p>
                  <div className="flex gap-3 px-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
                    {heroPosts.slice(1).map((post, i) => (
                      <Link key={post.id} href={`/post/${post.id}`}>
                        <div className="relative flex-none w-[140px] h-[72px] rounded-2xl overflow-hidden snap-start cursor-pointer group border border-white/[0.07]">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/45 transition-all group-hover:bg-black/25" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-serif font-bold text-sm tracking-wide text-white line-clamp-1 px-2 text-center">{post.title}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 2-col grid */}
              {gridPosts.length > 0 && (
                <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 px-4">
                  {gridPosts.map((post) => (
                    <motion.div
                      key={post.id}
                      variants={itemVariants}
                      className="relative aspect-[4/5] rounded-2xl overflow-hidden group cursor-pointer border border-white/[0.07]"
                    >
                      <Link href={`/post/${post.id}`} className="block w-full h-full">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

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
