import React from 'react';
import { db } from '@/lib/db';
import ExploreFeed from '@/components/ExploreFeed';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const initialVideos = await db.getVideos({ sort: 'newest' });

  return <ExploreFeed initialVideos={initialVideos} />;
}
