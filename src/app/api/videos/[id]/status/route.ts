import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const id = params.id;
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId') || '';

    if (!sessionId) {
      return NextResponse.json({ saved: false, liked: false });
    }

    const status = await db.getSessionStatus(id, sessionId);
    return NextResponse.json(status);
  } catch (error) {
    console.error('API Error in /api/videos/[id]/status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
