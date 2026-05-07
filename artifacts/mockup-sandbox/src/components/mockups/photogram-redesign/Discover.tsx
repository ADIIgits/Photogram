import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart } from "lucide-react";

export function Discover() {
  const [activeTab, setActiveTab] = useState("Trending");
  const tabs = ["Trending", "Recent", "Following"];

  const trendingCategories = [
    { name: "Street", img: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=400&q=80" },
    { name: "Portrait", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80" },
    { name: "Landscape", img: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&q=80" },
    { name: "Night", img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80" }
  ];

  const gridPosts = [
    { id: 1, title: "Neon Nights", likes: "1.2k", img: "https://images.unsplash.com/photo-1555448248-2571daf6344b?w=600&q=80" },
    { id: 2, title: "Morning Fog", likes: "856", img: "https://images.unsplash.com/photo-1444465693019-aa0b6392460d?w=600&q=80" },
    { id: 3, title: "Urban Symmetry", likes: "2.1k", img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80" },
    { id: 4, title: "Desert Sun", likes: "943", img: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=600&q=80" },
    { id: 5, title: "Coffee & Light", likes: "432", img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80" },
    { id: 6, title: "Hidden Alley", likes: "1.5k", img: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=600&q=80" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-[390px] h-[844px] bg-[#0a0a0a] text-[#fafafa] overflow-hidden flex flex-col font-['Inter'] relative isolate selection:bg-white/20 ring-1 ring-white/10 rounded-[40px] shadow-2xl mx-auto my-8">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

      {/* Frosted Navbar */}
      <header className="px-5 pt-12 pb-4 flex items-center justify-between z-50 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <h1 className="text-2xl font-black tracking-tight">Discover</h1>
        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
          <Search className="w-4 h-4 text-white/80" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {/* iOS-Style Pill Row */}
        <div className="px-5 py-4">
          <div className="flex p-1 bg-white/5 rounded-full border border-white/[0.05] relative isolate backdrop-blur-md">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 relative z-10 py-2 text-sm font-medium transition-colors duration-300 ${
                    isActive ? "text-black" : "text-white/60 hover:text-white/90"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-full shadow-lg"
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

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8 pb-8"
        >
          {/* Featured Hero */}
          <motion.div variants={itemVariants} className="px-5">
            <div className="relative h-[220px] rounded-3xl overflow-hidden group cursor-pointer border border-white/[0.08]">
              <img 
                src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80" 
                alt="Editor's Pick"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute top-4 left-4">
                <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 font-['Space_Mono']">
                    Editor's Pick
                  </span>
                </div>
              </div>

              <div className="absolute bottom-0 inset-x-0 p-5 pt-12 flex flex-col justify-end bg-gradient-to-t from-black/90 to-transparent">
                <h2 className="text-2xl font-bold font-['Playfair_Display'] text-white leading-tight mb-2">
                  The Golden Hour
                </h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80" alt="Author" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-medium text-white/80">@sarah.lens</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80">
                    <Heart className="w-4 h-4 fill-white/80" />
                    <span className="text-xs font-bold font-['Space_Mono']">12.4k</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trending Categories */}
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="px-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Trending Now</h3>
            </div>
            <div className="flex gap-3 px-5 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
              {trendingCategories.map((cat, i) => (
                <div key={i} className="relative flex-none w-[140px] h-[72px] rounded-2xl overflow-hidden snap-start cursor-pointer group border border-white/[0.08]">
                  <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-all group-hover:bg-black/20 group-hover:backdrop-blur-none" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-['Playfair_Display'] font-bold text-base tracking-wide">{cat.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Grid */}
          <motion.div variants={containerVariants} className="px-5 grid grid-cols-2 gap-4">
            {gridPosts.map((post) => (
              <motion.div 
                variants={itemVariants}
                key={post.id} 
                className="relative aspect-[4/5] rounded-2xl overflow-hidden group cursor-pointer border border-white/[0.08]"
              >
                <img src={post.img} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <h4 className="font-['Playfair_Display'] font-bold text-sm text-white mb-1 line-clamp-1">{post.title}</h4>
                  <div className="flex items-center gap-1.5 text-white/60">
                    <Heart className="w-3 h-3" />
                    <span className="text-[10px] font-['Space_Mono']">{post.likes}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
