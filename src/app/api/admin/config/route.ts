import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const config = await db.getConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    console.error('API Error in GET /api/admin/config:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await db.updateConfig(body);
    return NextResponse.json({ success: true, config: updated });
  } catch (error: any) {
    console.error('API Error in POST /api/admin/config:', error);
    return NextResponse.json({ error: 'Failed to update system config', details: error.message }, { status: 500 });
  }
}
