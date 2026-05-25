'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Film, Sunset, CloudRain, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Video, SystemConfig } from '@/lib/types';
import VideoPlayer from './VideoPlayer';
import VideoCard from './VideoCard';
import { CATEGORIES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface HomeFeedProps {
  initialVideos: Video[];
  initialConfig: SystemConfig;
}

// Moods definitions
const MOODS = [
  { id: 'all', name: 'All Spaces ✨', icon: Sparkles, query: {} },
  { id: 'monsoon', name: 'Rainy Cozy ☔', icon: CloudRain, filter: { lighting: 'Monsoon atmosphere', style: 'Warm Cozy' } },
  { id: 'sunset', name: 'Warm Sunset 🌅', icon: Sunset, filter: { lighting: 'Golden hour sunlight' } },
  { id: 'luxury', name: 'Luxury Modern ✨', icon: Trophy, filter: { style: 'Luxury Modern' } }
];

export default function HomeFeed({ initialVideos, initialConfig }: HomeFeedProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeMood, setActiveMood] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // State for countdown timer till next generation
  const [countdownText, setCountdownText] = useState<string>('');

  useEffect(() => {
    if (!initialVideos || initialVideos.length === 0) return;
    const latestVideo = initialVideos[0];

    const intervalMinutes = initialConfig.generationInterval || 240;
    const intervalMs = intervalMinutes * 60 * 1000;
    const latestCreatedTime = new Date(latestVideo.createdAt).getTime();
    const nextGenerationTime = latestCreatedTime + intervalMs;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = nextGenerationTime - now;

      if (diff <= 0) {
        setCountdownText('Generating now...');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let text = '';
      if (hours > 0) {
        text = `Next loop in ${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        text = `Next loop in ${minutes}m ${seconds}s`;
      } else {
        text = `Next loop in ${seconds}s`;
      }
      setCountdownText(text);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [initialVideos, initialConfig.generationInterval]);



  // Hero latest video is the absolute newest item in the DB
  const heroVideo = useMemo(() => {
    if (initialVideos.length === 0) return null;
    return initialVideos[0];
  }, [initialVideos]);

  // Rest of the videos for the grid feed
  const feedVideos = useMemo(() => {
    if (initialVideos.length === 0) return [];
    // remove hero video from grid to avoid duplicate display, unless filtered
    return videos.filter(v => v.id !== heroVideo?.id || searchQuery !== '' || activeCategory !== 'All' || activeMood !== 'all');
  }, [videos, heroVideo, searchQuery, activeCategory, activeMood]);

  // Calculate dynamic pagination bounds
  const limit = initialConfig.homeVideosLimit;
  const totalPages = Math.max(1, Math.ceil(feedVideos.length / limit));

  const paginatedFeed = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return feedVideos.slice(start, start + limit);
  }, [feedVideos, currentPage, limit]);

  // Reset page to 1 when filters are changed
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeMood, searchQuery]);

  // Perform dynamic filtering based on local state
  useEffect(() => {
    let result = [...initialVideos];

    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter(v => v.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // Mood filter
    if (activeMood !== 'all') {
      const mood = MOODS.find(m => m.id === activeMood);
      if (mood && mood.filter) {
        result = result.filter(v => {
          return Object.entries(mood.filter).every(([key, val]) => {
            const videoVal = (v as any)[key];
            return videoVal && videoVal.toLowerCase().includes(val.toLowerCase());
          });
        });
      }
    }

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => 
        v.title.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.style.toLowerCase().includes(q) ||
        v.selectedItems.some(i => i.toLowerCase().includes(q))
      );
    }

    setVideos(result);
  }, [activeCategory, activeMood, searchQuery, initialVideos]);

  const handleMoodSelect = (moodId: string) => {
    setActiveMood(moodId);
    setActiveCategory('All'); // Reset category when switching mood
  };

  return (
    <div className="flex flex-col gap-10">
      
      {/* 1. Immersive Hero Latest Video Player */}
      {heroVideo && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                Latest Live Stream Inspiration
              </span>
            </div>
            <span className="text-xs text-neutral-500 flex items-center gap-1.5 flex-wrap justify-end">
              <span>New loop generated automatically every {initialConfig.generationInterval >= 60 ? `${initialConfig.generationInterval / 60} hours` : `${initialConfig.generationInterval} minutes`}</span>
              {countdownText && (
                <>
                  <span className="w-1 h-1 rounded-full bg-neutral-600 hidden sm:inline" />
                  <span className="text-amber-500/80 font-bold font-mono animate-pulse">{countdownText}</span>
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* Hero Player */}
            <div className="lg:col-span-2">
              <VideoPlayer video={heroVideo} autoPlay={true} />
            </div>

            {/* Hero Text Details (Sleek minimalist panel with mock metrics removed) */}
            <div className="glass-panel p-6 md:p-8 rounded-2xl flex flex-col justify-center border border-white/5 shadow-xl relative overflow-hidden">
              {/* Background amber glow */}
              <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

              <div className="flex flex-col gap-5 relative z-10">
                <div className="flex gap-2 items-center">
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-extrabold text-amber-500 uppercase tracking-wider">
                    {heroVideo.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-neutral-300">
                    {heroVideo.style}
                  </span>
                </div>

                <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight leading-tight">
                  {heroVideo.title}
                </h1>

                <p className="text-xs md:text-sm text-neutral-400 font-medium italic leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5">
                  "{heroVideo.prompt}"
                </p>

                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Lighting Atmosphere:
                  </span>
                  <span className="text-sm text-neutral-300 capitalize font-medium">
                    {heroVideo.lighting}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Mood of the Day Section */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display font-bold text-xl text-neutral-200 tracking-tight flex items-center gap-2">
          <Film className="w-5 h-5 text-amber-500" />
          Mood of the Day
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MOODS.map((mood) => {
            const Icon = mood.icon;
            const isSelected = activeMood === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => handleMoodSelect(mood.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-luxury ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                    : 'glass-panel-light border-white/5 text-neutral-400 hover:text-white hover:border-white/10 hover:bg-white/5'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500 text-neutral-950' : 'bg-white/5 text-neutral-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs md:text-sm font-semibold tracking-tight">{mood.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Category Tabs & Feed Grid */}
      <section className="flex flex-col gap-6 mt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 max-w-full no-scrollbar">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-luxury ${
                activeCategory === 'All'
                  ? 'bg-white text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Spaces
            </button>
            {CATEGORIES.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-luxury ${
                  activeCategory === cat
                    ? 'bg-white text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search design styles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-1.5 rounded-full glass-panel-light border-white/5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 w-full md:w-60 focus:bg-neutral-950/80 transition-luxury"
            />
          </div>
        </div>

        {/* Video Grid Feed with Pagination and Framer Motion Transitions */}
        {paginatedFeed.length > 0 ? (
          <div className="flex flex-col gap-10">
            <div className="relative overflow-hidden min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage + activeCategory + activeMood}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                >
                  {paginatedFeed.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/5 pt-8 mt-4">
                <span className="text-xs text-neutral-500 font-medium">
                  Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-neutral-300 font-bold">{totalPages}</span> ({feedVideos.length} designs)
                </span>

                <div className="flex items-center gap-3">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="flex items-center gap-1 px-4 py-2 rounded-full border glass-panel text-xs font-bold text-neutral-400 hover:text-white border-white/5 hover:border-white/10 disabled:opacity-30 disabled:pointer-events-none hover:scale-[1.02] transition-luxury"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    <span>Previous</span>
                  </button>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="flex items-center gap-1 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 text-neutral-950 text-xs font-bold uppercase tracking-wider hover:shadow-lg shadow-amber-500/10 disabled:opacity-30 disabled:pointer-events-none hover:scale-[1.02] transition-luxury"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 glass-panel rounded-2xl border border-white/5">
            <p className="text-neutral-400 text-sm">No premium design videos match your active filters.</p>
            <button 
              onClick={() => { setActiveCategory('All'); setActiveMood('all'); setSearchQuery(''); }}
              className="mt-4 text-xs font-bold text-amber-500 hover:text-amber-400 underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
