'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Video } from '@/lib/types';
import { useSession } from './SessionProvider';

interface VideoPlayerProps {
  video: Video;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export default function VideoPlayer({ video, autoPlay = true, onEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionId = useSession();
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const watchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto play trigger on video change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (autoPlay) {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
      setHasTrackedView(false); // Reset view tracker for the new video
    }
  }, [video, autoPlay]);

  // Robust View Tracking: Count view if user watches at least 3 seconds continuously
  useEffect(() => {
    if (isPlaying && !hasTrackedView && sessionId && video.id) {
      // Start 3-second continuous watch timer
      watchTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/videos/${video.id}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          });
          if (res.ok) {
            setHasTrackedView(true);
            // Proactively update local counts if successful (handled by state in parent normally)
          }
        } catch (err) {
          console.error('Failed to track view:', err);
        }
      }, 3000);
    } else {
      // Clear timer if paused or reset
      if (watchTimerRef.current) {
        clearTimeout(watchTimerRef.current);
        watchTimerRef.current = null;
      }
    }

    return () => {
      if (watchTimerRef.current) {
        clearTimeout(watchTimerRef.current);
      }
    };
  }, [isPlaying, hasTrackedView, sessionId, video.id]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Play failed:', err));
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || video.duration;
    setCurrentTime(cur);
    setProgress((cur / dur) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickPercentage = clickX / width;
    const newTime = clickPercentage * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(clickPercentage * 100);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div 
      className="relative w-full aspect-cinematic rounded-2xl overflow-hidden bg-black/90 border border-white/5 shadow-2xl group cursor-pointer"
      onClick={() => togglePlay()}
    >
      {/* Immersive Video element */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="w-full h-full object-cover rounded-2xl"
        loop
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
      />

      {/* Screen Play Overlay Indicator (Glows momentarily when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-luxury z-10">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform scale-100 hover:scale-105 transition-luxury">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Ambient top shading */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-luxury duration-300 z-10" />

      {/* Ambient bottom shading for controls */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-luxury duration-300 z-10" />

      {/* Video Control Bar */}
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-luxury duration-300 z-20">
        
        {/* Progress Slider */}
        <div 
          className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer relative overflow-hidden group/progress"
          onClick={handleProgressBarClick}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Playback Buttons & Indicators */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play Button */}
            <button 
              onClick={togglePlay}
              className="p-1.5 text-neutral-300 hover:text-white transition-luxury hover:scale-105"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Mute Button */}
            <button 
              onClick={toggleMute}
              className="p-1.5 text-neutral-300 hover:text-white transition-luxury hover:scale-105"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Time tracker */}
            <span className="text-xs text-neutral-400 font-medium">
              {formatTime(currentTime)} / {formatTime(duration || video.duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 10s Tag badge */}
            <span className="px-2.5 py-0.5 rounded bg-black/60 border border-white/10 text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">
              {video.duration} Sec Loop
            </span>

            {/* Fullscreen Button */}
            <button 
              onClick={handleFullscreen}
              className="p-1.5 text-neutral-300 hover:text-white transition-luxury"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
