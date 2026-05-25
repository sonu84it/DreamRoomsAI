import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await db.resetMetrics();
    return NextResponse.json({ success: true, message: 'All system metrics have been reset to 0.' });
  } catch (error: any) {
    console.error('API Error in POST /api/admin/reset:', error);
    return NextResponse.json({ error: 'Failed to reset metrics', details: error.message }, { status: 500 });
  }
}
