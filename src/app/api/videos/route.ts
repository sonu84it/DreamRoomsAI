import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const style = searchParams.get('style') || undefined;
    const lighting = searchParams.get('lighting') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = (searchParams.get('sort') as any) || undefined;
    const saved = searchParams.get('saved') === 'true';
    const sessionId = searchParams.get('sessionId') || '';
    const paginate = searchParams.get('paginate') === 'true';

    // Parse page and limit
    const pageVal = searchParams.get('page');
    const limitVal = searchParams.get('limit');
    const page = pageVal ? Math.max(1, parseInt(pageVal, 10)) : 1;
    const sysConfig = await db.getConfig();
    const limit = limitVal ? Math.max(1, parseInt(limitVal, 10)) : sysConfig.homeVideosLimit;

    // If requesting saved videos for a specific anonymous session
    if (saved && sessionId) {
      const savedVideos = await db.getSavedVideos(sessionId);
      
      // Still apply query parameters on top of saved items
      let filteredSaved = [...savedVideos];
      
      if (category && category !== 'All') {
        filteredSaved = filteredSaved.filter(v => v.category.toLowerCase() === category.toLowerCase());
      }
      if (style && style !== 'All') {
        filteredSaved = filteredSaved.filter(v => v.style.toLowerCase() === style.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        filteredSaved = filteredSaved.filter(v => 
          v.title.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          v.style.toLowerCase().includes(q) ||
          v.prompt.toLowerCase().includes(q)
        );
      }
      
      // Default sort for saved is newest bookmarked first, or date generated
      filteredSaved.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return NextResponse.json(filteredSaved);
    }

    const videos = await db.getVideos({ category, style, lighting, search, sort });

    if (paginate) {
      const total = videos.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedVideos = videos.slice(offset, offset + limit);

      return NextResponse.json({
        videos: paginatedVideos,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      });
    }

    return NextResponse.json(videos);
  } catch (error) {
    console.error('API Error in /api/videos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
