import React from "react";
import { motion } from "framer-motion";
import { Aperture, Home, Compass, Plus, User, Search, Heart } from "lucide-react";

const photos = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80",
    author: "Elena R.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    likes: "2.4k",
    colSpan: "col-span-2",
    rowSpan: "row-span-1",
    aspect: "aspect-[2/1]",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&w=600&q=80",
    author: "Marcus T.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
    likes: "1.1k",
    colSpan: "col-span-1",
    rowSpan: "row-span-1",
    aspect: "aspect-square",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=600&q=80",
    author: "Sarah W.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    likes: "856",
    colSpan: "col-span-1",
    rowSpan: "row-span-2",
    aspect: "aspect-[3/4]",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80",
    author: "David K.",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80",
    likes: "3.2k",
    colSpan: "col-span-1",
    rowSpan: "row-span-1",
    aspect: "aspect-square",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80",
    author: "Lisa M.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
    likes: "4.5k",
    colSpan: "col-span-2",
    rowSpan: "row-span-1",
    aspect: "aspect-[2/1]",
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80",
    author: "Omar S.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    likes: "942",
    colSpan: "col-span-1",
    rowSpan: "row-span-1",
    aspect: "aspect-square",
  },
  {
    id: 7,
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80",
    author: "Anna J.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    likes: "1.8k",
    colSpan: "col-span-1",
    rowSpan: "row-span-2",
    aspect: "aspect-[3/4]",
  },
  {
    id: 8,
    url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80",
    author: "Tom H.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    likes: "5.1k",
    colSpan: "col-span-1",
    rowSpan: "row-span-1",
    aspect: "aspect-square",
  },
];

export function Feed() {
  return (
    <div
      className="relative w-full h-[844px] max-w-[390px] mx-auto overflow-hidden bg-[#0a0a0a] text-[#fafafa] font-sans"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Navbar */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-12 pb-4 px-6 bg-black/40 backdrop-blur-xl border-b border-white/5 flex justify-between items-center">
        <h1
          className="text-2xl tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Photogram
        </h1>
        <Aperture className="w-6 h-6 text-white/80" strokeWidth={1.5} />
      </div>

      {/* Main Scrollable Area */}
      <div className="h-full w-full overflow-y-auto pb-32 pt-28 no-scrollbar">
        <div className="px-6 mb-6">
          <h2 className="text-[52px] font-black leading-none tracking-tighter">
            Feed
          </h2>
          <p className="text-[#1f1f1f] text-lg font-medium mt-1 font-mono tracking-tight text-white/40">
            May 2026
          </p>
        </div>

        {/* Masonry-ish Grid */}
        <div className="grid grid-cols-2 gap-3 px-3">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: i * 0.06,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className={`relative group rounded-xl overflow-hidden bg-[#0f0f0f] cursor-pointer ${photo.colSpan} ${photo.rowSpan} ${photo.aspect}`}
            >
              <img
                src={photo.url}
                alt={`Photo by ${photo.author}`}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
              />
              
              {/* Glass overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={photo.avatar}
                      alt={photo.author}
                      className="w-6 h-6 rounded-full border border-white/20"
                    />
                    <span className="text-xs font-medium text-white/90">
                      {photo.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-white/80 fill-white/20" />
                    <span className="text-[10px] font-mono text-white/80">
                      {photo.likes}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 pb-8 pt-4 px-6 bg-black/50 backdrop-blur-xl border-t border-white/10 z-50"
      >
        <div className="flex justify-between items-center max-w-sm mx-auto">
          <div className="flex flex-col items-center gap-1 relative">
            <Home className="w-6 h-6 text-[#3b82f6] fill-[#3b82f6]/20" />
            <div className="w-1 h-1 rounded-full bg-[#3b82f6] absolute -bottom-3" />
          </div>
          <Compass className="w-6 h-6 text-white/40 hover:text-white/80 transition-colors" />
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/10 cursor-pointer hover:scale-105 transition-transform">
            <Plus className="w-6 h-6 text-black" strokeWidth={3} />
          </div>
          <Search className="w-6 h-6 text-white/40 hover:text-white/80 transition-colors" />
          <User className="w-6 h-6 text-white/40 hover:text-white/80 transition-colors" />
        </div>
      </motion.div>
      
      {/* Inject custom font styles if they aren't globally available */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Space+Mono&display=swap');
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
