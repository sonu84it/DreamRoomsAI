'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Heart, Bookmark, Share2, Sparkles, AlertCircle } from 'lucide-react';
import { Video } from '@/lib/types';
import VideoPlayer from './VideoPlayer';
import VideoCard from './VideoCard';
import { useSession } from './SessionProvider';

interface RoomDetailClientProps {
  video: Video;
  relatedVideos: Video[];
  nextVideoSlug: string;
}

export default function RoomDetailClient({ video, relatedVideos, nextVideoSlug }: RoomDetailClientProps) {
  const router = useRouter();
  const sessionId = useSession();
  
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [saveCount, setSaveCount] = useState(video.saveCount);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync session bookmark/like state
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

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(video.prompt)
      .then(() => {
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
      })
      .catch(err => console.error('Failed to copy prompt:', err));
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/room/${video.slug}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch(err => console.error('Failed to copy link:', err));
  };

  const handleBookmarkToggle = async () => {
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

  const handleLikeToggle = async () => {
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

  // Implements: "Infinite Autoplay - When video ends: autoplay next video."
  const handleVideoEnded = () => {
    if (nextVideoSlug) {
      // Small delay for natural transition feel
      setTimeout(() => {
        router.push(`/room/${nextVideoSlug}`);
      }, 800);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      
      {/* Immersive Cinematic Player Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        
        {/* Large Autoplay Video Player */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <VideoPlayer video={video} autoPlay={true} onEnded={handleVideoEnded} />
          
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1.5">
            <span> Deduplicated Anonymous Watch Time Tracker Enabled</span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-semibold text-neutral-400">Autoplay Next Loop Queue Active</span>
            </div>
          </div>
        </div>

        {/* Room Specs & Details sidebar */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden flex flex-col gap-5">
            {/* Title & Category Badges */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                  {video.category}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-neutral-300">
                  {video.style}
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl text-white tracking-tight leading-snug">
                {video.title}
              </h1>
            </div>

            {/* Quick Action bar */}
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
              <button
                onClick={handleLikeToggle}
                className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition-luxury gap-1 ${
                  isLiked
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-500'
                    : 'glass-panel-light border-white/5 text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Heart className={`w-4.5 h-4.5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount} Likes</span>
              </button>

              <button
                onClick={handleBookmarkToggle}
                className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition-luxury gap-1 ${
                  isSaved
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                    : 'glass-panel-light border-white/5 text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bookmark className={`w-4.5 h-4.5 ${isSaved ? 'fill-current' : ''}`} />
                <span>{saveCount} Saves</span>
              </button>

              <button
                onClick={handleCopyLink}
                className={`flex flex-col items-center justify-center py-2.5 rounded-xl border glass-panel-light border-white/5 text-neutral-400 hover:text-white hover:bg-white/5 transition-luxury relative gap-1`}
              >
                {copiedLink ? <Check className="w-4.5 h-4.5 text-emerald-500" /> : <Share2 className="w-4.5 h-4.5" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>
            </div>

            {/* Atmosphere Specs details */}
            <div className="flex flex-col gap-3.5 border-t border-white/5 pt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-medium">Lighting Atmosphere</span>
                <span className="text-neutral-300 font-semibold capitalize">{video.lighting}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-medium">Camera Motion Style</span>
                <span className="text-neutral-300 font-semibold capitalize">{video.cameraMotion}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-medium">Loop Duration</span>
                <span className="text-neutral-300 font-semibold uppercase tracking-wider text-amber-500">{video.duration} Seconds</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-medium">Views Impression</span>
                <span className="text-neutral-300 font-semibold">{video.viewCount} Views</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Details Row: Prompt & Items Mappings */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        
        {/* Prompts copier section */}
        <div className="lg:col-span-2 glass-panel p-6 md:p-8 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-neutral-200 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Generated Cinematic Prompt
            </h3>
            
            <button
              onClick={handleCopyPrompt}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-luxury ${
                copiedPrompt
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg'
                  : 'glass-panel-light border-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? 'Copied Prompt' : 'Copy Prompt'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-medium italic text-sm leading-relaxed text-neutral-300">
            "{video.prompt}"
          </div>

          <div className="flex items-start gap-2.5 text-xs text-neutral-500 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-500/80 shrink-0 mt-0.5" />
            <p>
              This prompt was compiled intelligently using our Controlled Randomness Rule Engine. In production, this prompt is securely dispatched to the Google Cloud Vertex AI (Veo/Omni) API to generate raw looping photorealistic MP4 renders.
            </p>
          </div>
        </div>

        {/* Interior elements list shown */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
          <h3 className="font-display font-bold text-lg text-neutral-200 tracking-tight">
            Selected Room Elements
          </h3>

          <div className="flex flex-wrap gap-2">
            {video.selectedItems.map((item, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] text-neutral-300 capitalize font-medium"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider border-t border-white/5 pt-4 mt-2">
            Target composition: {video.selectedItems.length} Coherent Objects
          </div>
        </div>

      </section>

      {/* "More Like This" similar recommendations */}
      <section className="flex flex-col gap-6 mt-4">
        <h2 className="font-display font-bold text-xl text-neutral-200 tracking-tight">
          More Like This
        </h2>

        {relatedVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedVideos.map((item) => (
              <VideoCard key={item.id} video={item} />
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 text-sm">No similar architectural spaces generated yet.</p>
        )}
      </section>

    </div>
  );
}
