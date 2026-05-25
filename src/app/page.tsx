import React from 'react';
import { db } from '@/lib/db';
import HomeFeed from '@/components/HomeFeed';

// Force dynamic server rendering to fetch the newest schedule generated video loops
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch dynamic system configuration
  const config = await db.getConfig();
  
  // Fetch initial videos sorted by newest first
  const initialVideos = await db.getVideos({ sort: 'newest' });

  return <HomeFeed initialVideos={initialVideos} initialConfig={config} />;
}
