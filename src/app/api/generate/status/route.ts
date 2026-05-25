import { NextRequest, NextResponse } from 'next/server';
import { getJobStatus } from '@/lib/videoJob';

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  const status = getJobStatus(jobId);
  
  if (!status) {
    return NextResponse.json({ error: 'Job not found', jobId }, { status: 404 });
  }

  return NextResponse.json({
    jobId,
    status: status.status,        // 'pending' | 'success' | 'failed'
    videoId: status.videoId,
    error: status.error,
    done: status.status !== 'pending'
  });
}
