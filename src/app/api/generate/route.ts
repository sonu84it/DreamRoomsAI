import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startVideoGeneration } from '@/lib/videoJob';

export async function POST(req: NextRequest) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // body empty or not json, ignore
    }

    const { category, style } = body as { category?: string; style?: string };

    // Start generation async — do NOT await, return job info immediately
    const jobInfo = await startVideoGeneration({ category, style });

    return NextResponse.json({
      success: true,
      pending: true,
      jobId: jobInfo.jobId,
      message: `Video generation started for "${jobInfo.category}" (${jobInfo.style}). Poll /api/generate/status?jobId=${jobInfo.jobId} for updates.`,
    });
  } catch (error: any) {
    console.error('API Error in /api/generate:', error);
    db.log('error', `Video generation pipeline failed to start`, { error: error.message });
    return NextResponse.json({ error: 'Generation Pipeline Failed', details: error.message }, { status: 500 });
  }
}
