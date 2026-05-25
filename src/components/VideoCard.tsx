'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Bookmark, Share2, Play, Heart } from 'lucide-react';
import { Video } from '@/lib/types';
import { formatViews, formatRelativeTime } from '@/lib/utils';
import { useSession } from './SessionProvider';

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionId = useSession();
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [saveCount, setSaveCount] = useState(video.saveCount);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [copied, setCopied] = useState(false);

  // Sync statuses on session ready
  useEffect(() => {
    if (sessionId) {
      fetch(`/api/videos/${video.id}/status?sessionId=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setIsSaved(data.saved);
          setIsLiked(data.liked);
        })
        .catch(err => console.error('Failed to get status:', err));
    }
  }, [sessionId, video.id]);

  // Ensure autoplay triggers reliably on mount/video change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.log('Autoplay video failed:', err));
    }
  }, [video]);

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionId) return;

    try {
      const res = await fetch(`/api/videos/${video.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      setIsSaved(data.saved);
      setSaveCount(data.count);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionId) return;

    try {
      const res = await fetch(`/api/videos/${video.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      setIsLiked(data.liked);
      setLikeCount(data.count);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/room/${video.slug}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy link:', err));
  };

  return (
    <Link 
      href={`/room/${video.slug}`}
      className="group block rounded-2xl overflow-hidden glass-panel glass-panel-light hover:border-white/10 hover:shadow-xl hover:shadow-black/40 transition-luxury duration-300"
    >
      {/* Immersive Video Container */}
      <div className="relative aspect-cinematic w-full overflow-hidden bg-neutral-900 border-b border-white/5">
        
        {/* Continuous Loop Video Preview */}
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-luxury duration-500"
          muted
          loop
          autoPlay
          playsInline
        />

        {/* Cinematic Duration Badge */}
        <span className="absolute bottom-2.5 right-2.5 z-20 px-2 py-0.5 rounded bg-black/75 border border-white/5 text-[9px] font-bold text-neutral-200 tracking-wider">
          {video.duration}s
        </span>

        {/* Play icon reveal on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-luxury duration-300 pointer-events-none z-10">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-luxury">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 flex flex-col gap-2.5 relative z-10">
        
        {/* Category & Style Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-medium text-amber-500 uppercase tracking-widest">
            {video.category}
          </span>
          <span className="text-[9px] text-neutral-500">•</span>
          <span className="text-[10px] font-medium text-neutral-400">
            {video.style}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display font-semibold text-sm md:text-base text-neutral-100 group-hover:text-amber-500 transition-luxury leading-snug truncate">
          {video.title}
        </h3>

        {/* Prompt used to generate video */}
        <p className="text-[10px] text-neutral-400 font-medium italic leading-relaxed line-clamp-2 bg-neutral-950/40 px-2.5 py-2 rounded-lg border border-white/5 font-sans mt-0.5" title={video.prompt}>
          "{video.prompt}"
        </p>

        {/* Video Stats Grid */}
        <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {formatViews(video.viewCount)}
            </span>
            <span>•</span>
            <span>{formatRelativeTime(video.createdAt)}</span>
          </div>

          {/* Quick Actions (Like, Save, Share) */}
          <div className="flex items-center gap-1">
            {/* Like */}
            <button 
              onClick={handleLikeToggle}
              className={`p-1.5 rounded-full hover:bg-white/5 transition-luxury ${
                isLiked ? 'text-rose-500' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Like"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            {/* Bookmark */}
            <button 
              onClick={handleBookmarkToggle}
              className={`p-1.5 rounded-full hover:bg-white/5 transition-luxury ${
                isSaved ? 'text-amber-500' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Save"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            {/* Share */}
            <div className="relative">
              <button 
                onClick={handleShareClick}
                className="p-1.5 rounded-full hover:bg-white/5 text-neutral-500 hover:text-neutral-300 transition-luxury"
                title="Copy Link"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              
              {/* Copied alert popover */}
              {copied && (
                <span className="absolute bottom-8 right-0 px-2 py-0.5 rounded bg-amber-500 text-neutral-950 font-extrabold text-[8px] uppercase tracking-wider whitespace-nowrap shadow-md z-30">
                  Copied!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
