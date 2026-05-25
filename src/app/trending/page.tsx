import React from 'react';
import { db } from '@/lib/db';
import { Flame, Eye, Heart, Bookmark, Award } from 'lucide-react';
import VideoCard from '@/components/VideoCard';

export const dynamic = 'force-dynamic';

export default async function TrendingPage() {
  // Fetch videos sorted by different criteria to represent trending feeds
  const trendingVideos = await db.getVideos({ sort: 'trending' });
  const mostViewedVideos = await db.getVideos({ sort: 'views' });
  
  // Stagger "Recently Popular" by combining newest and moderate view counts
  const recentlyPopular = [...(await db.getVideos({ sort: 'newest' }))]
    .slice(0, 8)
    .sort((a, b) => b.likeCount - a.likeCount);

  return (
    <div className="flex flex-col gap-10">
      
      {/* Page Header */}
      <div>
        <h1 className="font-display font-extrabold text-3xl text-white tracking-tight flex items-center gap-2">
          <Flame className="w-8 h-8 text-amber-500 fill-amber-500" />
          Cinematic Trend Scores
        </h1>
        <p className="text-sm text-neutral-500">
          Rankings updated dynamically. Algorithm: <code className="bg-white/5 px-2 py-0.5 rounded text-amber-400 font-mono text-xs">Score = views + (saves * 3) + (likes * 2) + freshness_boost</code>
        </p>
      </div>

      {/* 1. Trending Now Leaderboard */}
      <section className="flex flex-col gap-6">
        <h2 className="font-display font-bold text-xl text-neutral-200 tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Trending Now (Top 3 Leaderboard)
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {trendingVideos.slice(0, 3).map((video, index) => {
            const places = ['1st Place', '2nd Place', '3rd Place'];
            const placeColors = [
              'from-amber-500 to-amber-300 text-neutral-950',
              'from-neutral-300 to-neutral-400 text-neutral-900',
              'from-amber-700 to-amber-800 text-white'
            ];

            return (
              <div key={video.id} className="relative flex flex-col">
                {/* Ribbon badge for rank placement */}
                <div className={`absolute top-4 left-4 z-30 px-3.5 py-1 rounded-full bg-gradient-to-r ${placeColors[index]} font-extrabold text-[10px] uppercase tracking-wider shadow-lg`}>
                  {places[index]}
                </div>
                
                <VideoCard video={video} />
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Most Viewed Today Feed */}
      <section className="flex flex-col gap-6 mt-4">
        <h2 className="font-display font-bold text-xl text-neutral-200 tracking-tight flex items-center gap-2">
          <Eye className="w-5 h-5 text-amber-500" />
          Most Viewed Today
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mostViewedVideos.slice(0, 4).map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>

      {/* 3. Recently Popular Feed */}
      <section className="flex flex-col gap-6 mt-4">
        <h2 className="font-display font-bold text-xl text-neutral-200 tracking-tight flex items-center gap-2">
          <Heart className="w-5 h-5 text-amber-500" />
          Recently Popular
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentlyPopular.slice(0, 4).map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>

    </div>
  );
}
