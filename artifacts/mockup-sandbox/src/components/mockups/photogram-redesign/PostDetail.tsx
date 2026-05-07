import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Share, Heart, MessageCircle, Bookmark, Send } from 'lucide-react';

export function PostDetail() {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="relative mx-auto w-[390px] h-[844px] bg-[#0a0a0a] text-[#fafafa] overflow-hidden font-sans flex flex-col shadow-2xl rounded-[40px] border border-white/10 ring-8 ring-black/50">
      {/* Photo Section */}
      <div className="relative h-[60%] w-full bg-black overflow-hidden shrink-0">
        <motion.img
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800"
          alt="Midnight Alley, Tokyo"
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Fade */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none" />

        {/* Top Floating Bar */}
        <div className="absolute top-12 inset-x-4 flex justify-between items-center z-10">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white transition-all active:scale-95">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white transition-all active:scale-95">
            <Share size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <motion.div 
        className="relative flex-1 overflow-y-auto pb-24 scrollbar-hide -mt-10 z-10"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="px-5 space-y-6">
          {/* Author Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100&h=100" 
                  alt="Alex Chen" 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white tracking-wide">Alex Chen</span>
                <span className="text-xs text-gray-400">@alexchen</span>
              </div>
            </div>
            <button className="px-4 py-1.5 rounded-full border border-white/20 text-xs font-medium text-white tracking-wide active:bg-white/10 transition-colors">
              Follow
            </button>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="inline-flex items-center px-2 py-1 rounded bg-white/5 border border-white/5">
              <span className="font-mono text-[10px] tracking-wider text-gray-300 uppercase">Leica M11 • 35mm f/1.4</span>
            </div>
            <h1 className="font-serif text-[22px] font-medium leading-tight tracking-tight text-white">
              Midnight Alley, Tokyo
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
              Lost in the neon glow of Shinjuku's backstreets. The rain adds a perfect layer of cinematic reflection to the scene. Shooting at f/1.4 to isolate the subject in the chaos.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsLiked(!isLiked)} 
                className="flex items-center gap-2 group active:scale-90 transition-transform"
              >
                <motion.div
                  animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart size={24} className={isLiked ? "fill-red-500 text-red-500" : "text-white"} strokeWidth={1.5} />
                </motion.div>
                <span className="font-mono text-xs text-gray-400">1.2k</span>
              </button>
              <button className="flex items-center gap-2 group active:scale-90 transition-transform">
                <MessageCircle size={24} className="text-white" strokeWidth={1.5} />
                <span className="font-mono text-xs text-gray-400">24</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button className="active:scale-90 transition-transform">
                <Bookmark size={24} className="text-white" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Comments Section */}
          <div className="space-y-5">
            <h3 className="font-mono text-xs tracking-widest text-gray-500 uppercase">3 Comments</h3>
            <div className="space-y-4">
              {[
                { name: "Sarah Jenkins", handle: "@sarahj", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100", text: "The tones here are absolutely unreal. Love the atmospheric vibe.", time: "2h" },
                { name: "Marcus Doe", handle: "@marcusd", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100", text: "What film simulation did you use for this? Or is it raw processed?", time: "5h" }
              ].map((comment, i) => (
                <motion.div 
                  key={i}
                  className="flex gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                >
                  <img src={comment.avatar} alt={comment.name} className="w-8 h-8 rounded-full object-cover mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{comment.name}</span>
                      <span className="text-xs text-gray-500">{comment.time}</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-snug">{comment.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Comment Input Bar */}
      <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-12 z-20">
        <div className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100" alt="Me" className="w-6 h-6 rounded-full object-cover" />
          <input 
            type="text" 
            placeholder="Add a comment..." 
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
          />
          <button className="text-gray-400 hover:text-white transition-colors">
            <Send size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
