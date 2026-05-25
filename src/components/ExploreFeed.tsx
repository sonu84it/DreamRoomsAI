'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Compass, SlidersHorizontal, Bookmark, Eye, Heart } from 'lucide-react';
import { Video } from '@/lib/types';
import VideoCard from './VideoCard';
import { CATEGORIES, STYLES, LIGHTING_MOODS } from '@/lib/constants';
import { useSession } from './SessionProvider';

interface ExploreFeedProps {
  initialVideos: Video[];
}

export default function ExploreFeed({ initialVideos }: ExploreFeedProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = useSession();
  const [isPending, startTransition] = useTransition();

  // Load initial states from URL query parameters if present
  const initialCategory = searchParams.get('category') || 'All';
  const initialStyle = searchParams.get('style') || 'All';
  const initialLighting = searchParams.get('lighting') || 'All';
  const initialSort = searchParams.get('sort') || 'newest';
  const initialSearch = searchParams.get('search') || '';
  const initialSaved = searchParams.get('saved') === 'true';

  const [category, setCategory] = useState(initialCategory);
  const [style, setStyle] = useState(initialStyle);
  const [lighting, setLighting] = useState(initialLighting);
  const [sort, setSort] = useState(initialSort);
  const [search, setSearch] = useState(initialSearch);
  const [savedOnly, setSavedOnly] = useState(initialSaved);

  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [savedVideoIds, setSavedVideoIds] = useState<string[]>([]);

  // If the query params in URL change, sync our states
  useEffect(() => {
    setCategory(searchParams.get('category') || 'All');
    setStyle(searchParams.get('style') || 'All');
    setLighting(searchParams.get('lighting') || 'All');
    setSort(searchParams.get('sort') || 'newest');
    setSearch(searchParams.get('search') || '');
    setSavedOnly(searchParams.get('saved') === 'true');
  }, [searchParams]);

  // Load saved item IDs for local filtering
  useEffect(() => {
    if (sessionId) {
      fetch(`/api/videos?saved=true&sessionId=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setSavedVideoIds(data.map((v: Video) => v.id));
        })
        .catch(err => console.error('Failed to load saves:', err));
    }
  }, [sessionId, videos]);

  // Perform dynamic filtering based on selections
  useEffect(() => {
    let result = [...initialVideos];

    // Filter bookmarked only
    if (savedOnly) {
      result = result.filter(v => savedVideoIds.includes(v.id));
    }

    // Filter by Category
    if (category !== 'All') {
      result = result.filter(v => v.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by Style
    if (style !== 'All') {
      result = result.filter(v => v.style.toLowerCase() === style.toLowerCase());
    }

    // Filter by Lighting
    if (lighting !== 'All') {
      result = result.filter(v => v.lighting.toLowerCase() === lighting.toLowerCase());
    }

    // Search Query
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v => 
        v.title.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.style.toLowerCase().includes(q) ||
        v.prompt.toLowerCase().includes(q) ||
        v.selectedItems.some(i => i.toLowerCase().includes(q))
      );
    }

    // Sort options
    if (sort === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'views') {
      result.sort((a, b) => b.viewCount - a.viewCount);
    } else if (sort === 'trending') {
      result.sort((a, b) => b.trendScore - a.trendScore);
    }

    setVideos(result);
  }, [category, style, lighting, sort, search, savedOnly, savedVideoIds, initialVideos]);

  // Helper to push URL updates
  const updateFilters = (key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'All' || value === '' || value === false) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    
    startTransition(() => {
      router.push(`/explore?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Search & Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white tracking-tight flex items-center gap-2">
            <Compass className="w-8 h-8 text-amber-500" />
            {savedOnly ? 'Your Saved Collection' : 'Explore Architectural Designs'}
          </h1>
          <p className="text-sm text-neutral-500">
            {savedOnly ? 'Your private bookmark library stored securely in local session.' : 'Filter through curated cinematic room templates and luxury styles.'}
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search bedroom, cozy, industrial..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateFilters('search', e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-full glass-panel-light border-white/5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:bg-neutral-950/80 transition-luxury"
          />
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Multi-Facet Filter Board */}
      <div className="glass-panel p-4 md:p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          Filter Settings
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Room Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                updateFilters('category', e.target.value);
              }}
              className="px-3.5 py-2 text-xs rounded-lg glass-panel-light border-white/5 text-neutral-200 focus:outline-none focus:border-amber-500/30"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 2. Architectural Style */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Interior Style</label>
            <select
              value={style}
              onChange={(e) => {
                setStyle(e.target.value);
                updateFilters('style', e.target.value);
              }}
              className="px-3.5 py-2 text-xs rounded-lg glass-panel-light border-white/5 text-neutral-200 focus:outline-none focus:border-amber-500/30"
            >
              <option value="All">All Styles</option>
              {STYLES.map(sty => (
                <option key={sty} value={sty}>{sty}</option>
              ))}
            </select>
          </div>

          {/* 3. Lighting Mood */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Lighting Mood</label>
            <select
              value={lighting}
              onChange={(e) => {
                setLighting(e.target.value);
                updateFilters('lighting', e.target.value);
              }}
              className="px-3.5 py-2 text-xs rounded-lg glass-panel-light border-white/5 text-neutral-200 focus:outline-none focus:border-amber-500/30"
            >
              <option value="All">All Moods</option>
              {LIGHTING_MOODS.map(mood => (
                <option key={mood} value={mood}>{mood}</option>
              ))}
            </select>
          </div>

          {/* 4. Sorting */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Sort By</label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                updateFilters('sort', e.target.value);
              }}
              className="px-3.5 py-2 text-xs rounded-lg glass-panel-light border-white/5 text-neutral-200 focus:outline-none focus:border-amber-500/30"
            >
              <option value="newest">Newest Generated</option>
              <option value="views">Most Viewed</option>
              <option value="trending">Trending Now</option>
            </select>
          </div>
        </div>

        {/* Saved Library filter toggle */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSavedOnly(!savedOnly);
                updateFilters('saved', !savedOnly);
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border transition-luxury ${
                savedOnly 
                  ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                  : 'glass-panel-light border-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? 'fill-current' : ''}`} />
              Show Saved Library Only ({savedVideoIds.length})
            </button>
          </div>

          <button
            onClick={() => {
              setCategory('All');
              setStyle('All');
              setLighting('All');
              setSort('newest');
              setSearch('');
              setSavedOnly(false);
              router.push('/explore');
            }}
            className="text-xs text-neutral-500 hover:text-white transition-luxury font-medium"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Explore Grid Feed */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass-panel rounded-2xl border border-white/5">
          <p className="text-neutral-400 text-sm">No premium design videos match your exploration criteria.</p>
          {savedOnly && savedVideoIds.length === 0 && (
            <p className="text-neutral-500 text-xs mt-2">You haven't bookmarked any room loops yet. Click the bookmark icon on any card to save it.</p>
          )}
        </div>
      )}

    </div>
  );
}
