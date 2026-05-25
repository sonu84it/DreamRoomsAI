import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const analytics = await db.getAnalytics();
    const logs = await db.getLogs();
    const jobs = await db.getGenerationJobs();

    return NextResponse.json({
      analytics,
      logs,
      jobs
    });
  } catch (error) {
    console.error('API Error in /api/analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
