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

    const { category, style, force } = body as {
      category?: string;
      style?: string;
      force?: boolean;
    };

    // ── Cooldown Guard ──────────────────────────────────────────────
    // Enforce generationInterval: skip if the last video was generated
    // less than `generationInterval` minutes ago (unless force=true).
    if (!force) {
      const [config, videos, jobs] = await Promise.all([
        db.getConfig(),
        db.getVideos({ sort: 'newest' }),
        db.getGenerationJobs(),
      ]);

      // Guard 1: Prevent parallel duplicate generations if a job is already in progress
      const pendingJob = jobs.find((j) => j.status === 'PENDING');
      if (pendingJob) {
        db.log(
          'info',
          `Skipping generation — another generation job (${pendingJob.id}) is already in progress.`,
        );

        return NextResponse.json({
          success: true,
          skipped: true,
          reason: 'pending_job',
          jobId: pendingJob.id,
          message: `A video generation job is already in progress (Job ID: ${pendingJob.id}). Skipping to prevent parallel duplicates.`,
        });
      }

      const intervalMs = (config.generationInterval ?? 720) * 60 * 1000; // default 12 h
      const latestVideo = videos[0]; // already sorted newest-first

      if (latestVideo?.createdAt) {
        const lastGenTime = new Date(latestVideo.createdAt).getTime();
        const elapsed = Date.now() - lastGenTime;

        if (elapsed < intervalMs) {
          const remainingMs = intervalMs - elapsed;
          const remainingMin = Math.ceil(remainingMs / 60000);
          const nextEligible = new Date(lastGenTime + intervalMs).toISOString();

          db.log(
            'info',
            `Cooldown active — skipping generation. Last video ${Math.round(elapsed / 60000)}m ago, need ${config.generationInterval}m interval. Next eligible: ${nextEligible}`,
          );

          return NextResponse.json({
            success: true,
            skipped: true,
            reason: 'cooldown',
            lastVideoAt: latestVideo.createdAt,
            nextEligibleAt: nextEligible,
            remainingMinutes: remainingMin,
            message: `Cooldown active. Last video was generated ${Math.round(elapsed / 60000)} minutes ago. Next generation eligible in ${remainingMin} minutes (at ${nextEligible}).`,
          });
        }
      }
    }

    // ── Start Generation ────────────────────────────────────────────
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
