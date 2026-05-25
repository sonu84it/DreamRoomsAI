import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import RoomDetailClient from '@/components/RoomDetailClient';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export default async function RoomDetailPage(segmentData: { params: Params }) {
  const params = await segmentData.params;
  const slug = params.slug;
  const video = await db.getVideoByIdOrSlug(slug);

  if (!video) {
    notFound();
  }

  // Retrieve recommendations: same category or same style, excluding the current video
  const allVideos = await db.getVideos();
  let related = allVideos.filter(v => 
    v.id !== video.id && 
    (v.category.toLowerCase() === video.category.toLowerCase() || 
     v.style.toLowerCase() === video.style.toLowerCase())
  );

  // Fallback to general videos if not enough related ones
  if (related.length < 4) {
    const general = allVideos.filter(v => v.id !== video.id && !related.some(r => r.id === v.id));
    related.push(...general);
  }

  const slicedRelated = related.slice(0, 4);

  // Autoplay next queue select: next recommended video or next in database
  const nextVideo = slicedRelated[0] || allVideos.find(v => v.id !== video.id) || video;

  return (
    <RoomDetailClient 
      video={video} 
      relatedVideos={slicedRelated} 
      nextVideoSlug={nextVideo.slug} 
    />
  );
}
