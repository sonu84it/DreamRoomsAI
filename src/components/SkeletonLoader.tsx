import React from 'react';

// Shimmer skeleton representing a single Grid VideoCard
export function VideoCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden glass-panel glass-panel-light border border-white/5 flex flex-col gap-4 p-0">
      {/* Cinematic aspect ratio video box */}
      <div className="w-full aspect-cinematic skeleton-shimmer bg-neutral-900" />
      
      {/* Details mock shimmers */}
      <div className="px-4 pb-4 flex flex-col gap-2.5">
        {/* Badges line */}
        <div className="flex gap-2 items-center">
          <div className="w-16 h-3 rounded bg-neutral-800 skeleton-shimmer" />
          <div className="w-8 h-3 rounded bg-neutral-800 skeleton-shimmer" />
        </div>

        {/* Title line */}
        <div className="w-3/4 h-5 rounded bg-neutral-800 skeleton-shimmer" />

        {/* Bottom stats line */}
        <div className="flex justify-between items-center mt-2">
          <div className="w-24 h-3.5 rounded bg-neutral-800 skeleton-shimmer" />
          <div className="flex gap-1.5">
            <div className="w-6 h-6 rounded-full bg-neutral-800 skeleton-shimmer" />
            <div className="w-6 h-6 rounded-full bg-neutral-800 skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Shimmer representing the large Video Detail page Player
export function VideoPlayerSkeleton() {
  return (
    <div className="w-full aspect-cinematic rounded-2xl overflow-hidden bg-neutral-950 border border-white/5 shadow-2xl relative">
      <div className="w-full h-full skeleton-shimmer" />
    </div>
  );
}

// Shimmer for full sidebar or details text layout
export function DetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 rounded-2xl glass-panel">
      {/* Title */}
      <div className="w-1/2 h-8 rounded bg-neutral-800 skeleton-shimmer" />
      
      {/* Description lines */}
      <div className="flex flex-col gap-2.5">
        <div className="w-full h-4 rounded bg-neutral-800 skeleton-shimmer" />
        <div className="w-full h-4 rounded bg-neutral-800 skeleton-shimmer" />
        <div className="w-5/6 h-4 rounded bg-neutral-800 skeleton-shimmer" />
      </div>

      {/* Grid of badges */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="h-10 rounded-lg bg-neutral-800 skeleton-shimmer" />
        <div className="h-10 rounded-lg bg-neutral-800 skeleton-shimmer" />
      </div>
    </div>
  );
}

// Full page feed loading skeleton grid
export default function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}
