import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreHorizontal, Check } from 'lucide-react';

const COVER_IMAGE = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1000";
const AVATAR_IMAGE = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";

const GRID_IMAGES = [
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1516214104703-d2a1462c0e88?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1506744626753-1fa7604d4501?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400"
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
};

export function Profile() {
  const [activeTab, setActiveTab] = useState<'photos' | 'liked'>('photos');

  return (
    <div className="w-full h-full min-h-[844px] max-w-[390px] mx-auto bg-[#0a0a0a] text-[#fafafa] font-['Inter',sans-serif] overflow-y-auto overflow-x-hidden relative flex flex-col shadow-2xl">
      {/* Header / Cover Image */}
      <div className="relative w-full h-[180px] shrink-0">
        <img 
          src={COVER_IMAGE} 
          alt="Cover" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0a0a0a]"></div>
        
        {/* Top Nav Pills */}
        <div className="absolute top-12 left-0 right-0 px-4 flex justify-between items-center z-10">
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
            <ArrowLeft size={20} />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-8 flex-1 flex flex-col">
        {/* Avatar & Info Row */}
        <div className="flex justify-between items-end relative -mt-9 mb-4">
          <div className="relative">
            <img 
              src={AVATAR_IMAGE} 
              alt="Maya Tanaka" 
              className="w-[72px] h-[72px] rounded-full border-2 border-white object-cover"
            />
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center">
              <Check size={12} strokeWidth={3} className="text-white" />
            </div>
          </div>
          
          <div className="flex gap-2 mb-2">
            <button className="px-6 py-2 bg-white text-black font-semibold rounded-full text-[13px]">
              Follow
            </button>
            <button className="px-6 py-2 bg-white/10 border border-white/15 text-white font-semibold rounded-full text-[13px]">
              Message
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="mb-6">
          <h1 className="text-[20px] font-semibold leading-tight">Maya Tanaka</h1>
          <p className="text-[#1f1f1f] text-[13px] mt-1 opacity-70">Documentary photographer. Tokyo → NYC</p>
        </div>

        {/* Stats Row */}
        <motion.div 
          className="flex gap-2 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants} className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-white/[0.04]">
            <span className="text-[20px] font-bold tracking-tight">247</span>
            <span className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">Posts</span>
          </motion.div>
          <motion.div variants={itemVariants} className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-white/[0.04]">
            <span className="text-[20px] font-bold tracking-tight">12.4K</span>
            <span className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">Followers</span>
          </motion.div>
          <motion.div variants={itemVariants} className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-white/[0.04]">
            <span className="text-[20px] font-bold tracking-tight">891</span>
            <span className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">Following</span>
          </motion.div>
        </motion.div>

        {/* Segmented Control */}
        <div className="bg-white/8 p-1 rounded-full flex mb-6">
          <button 
            onClick={() => setActiveTab('photos')}
            className={`flex-1 py-2 text-[13px] font-medium rounded-full transition-all duration-200 ${activeTab === 'photos' ? 'bg-white text-black shadow-sm' : 'text-white/60 hover:text-white'}`}
          >
            Photos
          </button>
          <button 
            onClick={() => setActiveTab('liked')}
            className={`flex-1 py-2 text-[13px] font-medium rounded-full transition-all duration-200 ${activeTab === 'liked' ? 'bg-white text-black shadow-sm' : 'text-white/60 hover:text-white'}`}
          >
            Liked
          </button>
        </div>

        {/* Photo Grid */}
        <motion.div 
          className="grid grid-cols-3 gap-[2px] -mx-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={activeTab} // Re-trigger animation on tab change
        >
          {GRID_IMAGES.map((src, i) => (
            <motion.div 
              key={i} 
              variants={gridItemVariants}
              className="aspect-square bg-white/5 relative overflow-hidden"
            >
              <img 
                src={activeTab === 'liked' ? GRID_IMAGES[GRID_IMAGES.length - 1 - i] : src} 
                alt="Grid item" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
