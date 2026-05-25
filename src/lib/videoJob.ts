/**
 * videoJob.ts — Background video generation manager.
 * Starts a Veo video generation job and runs the polling loop in the background
 * without blocking the HTTP response. Job state is persisted in GCS db.json.
 */
import { generateVideoWithOmni } from './gcs';
import { generateNextRoomConfig } from './generator';
import { Storage } from '@google-cloud/storage';
import { prisma, isSqlEnabled } from './prisma';

const GCS_DB_BUCKET = process.env.GCS_BUCKET_NAME || 'dreamrooms-videos-lifeos-260524';
const GCS_DB_OBJECT = 'db.json';

const DEFAULT_CONFIG = {
  siteName: 'DreamRooms AI',
  generationInterval: 240,
  homeVideosLimit: 9,
  useMockData: false,
  heroVideoId: null,
  gcpProjectId: 'dreamrooms-lifeos-260524',
  gcpLocation: 'us-central1',
  vertexModel: 'veo-2.0-generate-001'
};

// In-memory job state for fast status checks within the same instance
const activeJobs = new Map<string, {
  status: 'pending' | 'success' | 'failed';
  videoId?: string;
  error?: string;
}>();

// Read db.json from GCS
async function readGCSDb(): Promise<any> {
  try {
    const storage = new Storage();
    const file = storage.bucket(GCS_DB_BUCKET).file(GCS_DB_OBJECT);
    const [exists] = await file.exists();
    if (exists) {
      const [contents] = await file.download();
      return JSON.parse(contents.toString('utf-8'));
    }
  } catch (e) {
    console.warn('[VideoJob] GCS db read failed:', (e as any)?.message);
  }
  return { videos: [], generationJobs: [], logs: [], config: { ...DEFAULT_CONFIG } };
}

// Write db.json to GCS
async function writeGCSDb(state: any): Promise<void> {
  try {
    const storage = new Storage();
    const file = storage.bucket(GCS_DB_BUCKET).file(GCS_DB_OBJECT);
    await file.save(Buffer.from(JSON.stringify(state, null, 2), 'utf-8'), {
      metadata: { contentType: 'application/json' }
    });
    console.log('[VideoJob] db.json saved to GCS');
  } catch (e) {
    console.error('[VideoJob] GCS db write failed:', (e as any)?.message);
  }
}

/**
 * Starts a video generation job asynchronously.
 * Returns immediately with job info — does NOT wait for generation to complete.
 */
export async function startVideoGeneration(customConfig?: { category?: string; style?: string }) {
  const state = await readGCSDb();
  const videos = state.videos || [];

  const targetConfig = generateNextRoomConfig(videos);
  const finalCategory = customConfig?.category || targetConfig.category;
  const finalStyle = customConfig?.style || targetConfig.style;
  const prompt = targetConfig.prompt;
  const title = `Elegant ${finalStyle} ${finalCategory}`;

  const jobId = `job-${Date.now()}`;
  const slug = `elegant-${finalStyle.toLowerCase().replace(/[\s\/]+/g, '-')}-${finalCategory.toLowerCase().replace(/[\s\/]+/g, '-')}-${Date.now().toString().slice(-4)}`;
  const destinationName = `dreamroom_${slug}.mp4`;

  console.log(`[VideoJob] ${jobId}: Starting async generation — "${title}"`);
  activeJobs.set(jobId, { status: 'pending' });

  // Persist pending job to GCS db
  state.generationJobs = state.generationJobs || [];
  state.generationJobs.unshift({
    id: jobId,
    status: 'PENDING',
    category: finalCategory,
    style: finalStyle,
    prompt,
    createdAt: new Date().toISOString()
  });
  await writeGCSDb(state);

  // Persist pending job to PostgreSQL
  if (isSqlEnabled) {
    try {
      await prisma.generationJob.create({
        data: {
          id: jobId,
          status: 'PENDING',
          category: finalCategory,
          style: finalStyle,
          prompt,
          createdAt: new Date()
        }
      });
      console.log(`[VideoJob] Created pending job ${jobId} in SQL DB`);
    } catch (e) {
      console.error(`[VideoJob] Failed to create pending job in SQL DB:`, e);
    }
  }

  // Run generation in background (non-blocking)
  runGenerationInBackground({ jobId, slug, destinationName, title, prompt, finalCategory, finalStyle, targetConfig });

  return { jobId, category: finalCategory, style: finalStyle, title };
}

async function runGenerationInBackground(params: {
  jobId: string; slug: string; destinationName: string; title: string;
  prompt: string; finalCategory: string; finalStyle: string; targetConfig: any;
}) {
  const { jobId, slug, destinationName, title, prompt, finalCategory, finalStyle, targetConfig } = params;

  try {
    console.log(`[VideoJob] ${jobId}: Calling Veo API for "${title}"...`);
    const videoUrl = await generateVideoWithOmni(prompt, destinationName);

    const thumbnailUrl = getThumbnail(finalCategory);
    const newVideoId = `video-${Date.now()}`;

    const newVideo = {
      id: newVideoId, slug, title, prompt, videoUrl, thumbnailUrl,
      category: finalCategory, style: finalStyle,
      lighting: targetConfig.lighting, cameraMotion: targetConfig.cameraMotion,
      selectedItems: targetConfig.selectedItems,
      duration: 8, createdAt: new Date().toISOString(),
      viewCount: 0, likeCount: 0, saveCount: 0, trendScore: 1000.0
    };

    // Read latest db state and add the video
    const state = await readGCSDb();
    state.videos = state.videos || [];
    state.videos.unshift(newVideo);

    const job = (state.generationJobs || []).find((j: any) => j.id === jobId);
    if (job) { job.status = 'SUCCESS'; job.completedAt = new Date().toISOString(); }

    await writeGCSDb(state);

    // Persist new video and update job status in PostgreSQL
    if (isSqlEnabled) {
      try {
        await prisma.video.create({
          data: {
            id: newVideoId,
            slug,
            title,
            prompt,
            videoUrl,
            thumbnailUrl,
            category: finalCategory,
            style: finalStyle,
            lighting: targetConfig.lighting || 'Festival lighting',
            cameraMotion: targetConfig.cameraMotion || 'subtle pan',
            selectedItems: targetConfig.selectedItems || [],
            duration: 8,
            createdAt: new Date(),
            viewCount: 0,
            likeCount: 0,
            saveCount: 0,
            trendScore: 1000.0
          }
        });
        console.log(`[VideoJob] Video inserted successfully into SQL DB: ${newVideoId}`);

        await prisma.generationJob.update({
          where: { id: jobId },
          data: {
            status: 'SUCCESS',
            completedAt: new Date()
          }
        });
      } catch (sqlErr) {
        console.error(`[VideoJob] Failed to write to SQL DB:`, sqlErr);
      }
    }

    activeJobs.set(jobId, { status: 'success', videoId: newVideoId });
    console.log(`[VideoJob] ${jobId}: DONE — ${videoUrl}`);

  } catch (error: any) {
    console.error(`[VideoJob] ${jobId}: FAILED —`, error?.message);
    activeJobs.set(jobId, { status: 'failed', error: error?.message });

    try {
      const state = await readGCSDb();
      const job = (state.generationJobs || []).find((j: any) => j.id === jobId);
      if (job) { job.status = 'FAILED'; job.completedAt = new Date().toISOString(); job.error = error?.message; }
      await writeGCSDb(state);
    } catch {}

    // Update failed job in PostgreSQL
    if (isSqlEnabled) {
      try {
        await prisma.generationJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errorMessage: error?.message
          }
        });
        console.log(`[VideoJob] Marked job ${jobId} as FAILED in SQL DB`);
      } catch (sqlErr) {
        console.error(`[VideoJob] Failed to update failed job in SQL DB:`, sqlErr);
      }
    }
  }
}

export function getJobStatus(jobId: string) {
  return activeJobs.get(jobId) || null;
}

function getThumbnail(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('bedroom') || cat.includes('guest')) return 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=600';
  if (cat.includes('dining')) return 'https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&q=80&w=600';
  if (cat.includes('kitchen')) return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600';
  if (cat.includes('bathroom')) return 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&q=80&w=600';
  if (cat.includes('office') || cat.includes('study') || cat.includes('reading')) return 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&q=80&w=600';
  if (cat.includes('gaming')) return 'https://images.unsplash.com/photo-1593642632632-d867b85ee943?auto=format&fit=crop&q=80&w=600';
  if (cat.includes('kids') || cat.includes('child')) return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600';
  if (cat.includes('balcony') || cat.includes('patio')) return 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=600';
  if (cat.includes('hall') || cat.includes('entry')) return 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=600';
  return 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=600';
}
