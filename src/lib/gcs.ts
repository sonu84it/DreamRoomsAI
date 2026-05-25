import { Storage } from '@google-cloud/storage';
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

// GCS Bucket config
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'dreamrooms-videos-lifeos-260524';
const GCP_PROJECT = process.env.GCP_PROJECT_ID || 'dreamrooms-lifeos-260524';
const GCP_LOCATION = process.env.GCP_LOCATION || 'us-central1';
const OMNI_MODEL = process.env.VERTEX_MODEL || 'veo-2.0-generate-001';

let storage: Storage | null = null;

// Initialize GCS storage client defensively
try {
  storage = new Storage();
} catch (e) {
  console.warn('GCS Client failed to initialize. Application Default Credentials not configured.', e);
}

// Initialize Google Auth for REST API calls
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

/**
 * Generates a video using Google Vertex AI Veo / Omni video generation.
 * Uses the predictLongRunning REST endpoint with polling.
 * 
 * @param prompt The text prompt describing the room
 * @param destinationName GCS object name (e.g. "dreamroom_elegant-japandi-bedroom-1234.mp4")
 * @returns Public GCS URL of the generated video
 */
export async function generateVideoWithOmni(
  prompt: string,
  destinationName: string
): Promise<string> {
  console.log(`[Omni] Starting video generation for: ${destinationName}`);
  console.log(`[Omni] Prompt: ${prompt.slice(0, 120)}...`);

  try {
    // Get an authenticated token
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    const accessToken = token.token;

    if (!accessToken) {
      throw new Error('Failed to obtain Google Cloud access token. Check Application Default Credentials.');
    }

    // Build the predictLongRunning endpoint
    const baseUrl = `https://${GCP_LOCATION}-aiplatform.googleapis.com/v1`;
    const endpoint = `${baseUrl}/projects/${GCP_PROJECT}/locations/${GCP_LOCATION}/publishers/google/models/${OMNI_MODEL}:predictLongRunning`;

    // POST the video generation request
    console.log(`[Omni] Calling ${OMNI_MODEL} at ${endpoint}`);
    const initResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt,
          }
        ],
        parameters: {
          aspectRatio: '16:9',
          durationSeconds: 8,
          sampleCount: 1,
        }
      }),
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      throw new Error(`Omni API initiation failed (${initResponse.status}): ${errorText}`);
    }

    const operation = await initResponse.json() as { name: string; done?: boolean; error?: { message: string }; response?: any };
    const operationName = operation.name;

    if (!operationName) {
      throw new Error(`No operation name returned from Omni API: ${JSON.stringify(operation)}`);
    }

    console.log(`[Omni] Operation started: ${operationName}`);

    // Poll via fetchPredictOperation (Veo-specific polling endpoint)
    const fetchOpUrl = `${baseUrl}/projects/${GCP_PROJECT}/locations/${GCP_LOCATION}/publishers/google/models/${OMNI_MODEL}:fetchPredictOperation`;
    const maxAttempts = 60; // 60 × 10s = 10 minutes max wait
    let attempts = 0;
    let opResult: any = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10s
      attempts++;

      const pollResponse = await fetch(fetchOpUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operationName }),
      });

      if (!pollResponse.ok) {
        console.warn(`[Omni] Poll attempt ${attempts} returned ${pollResponse.status}`);
        continue;
      }

      opResult = await pollResponse.json();
      console.log(`[Omni] Poll ${attempts}: done=${opResult.done}`);

      if (opResult.done) {
        break;
      }
    }

    if (!opResult?.done) {
      throw new Error(`Omni video generation timed out after ${attempts * 10}s`);
    }

    if (opResult.error) {
      throw new Error(`Omni API returned error: ${opResult.error.message}`);
    }

    // Extract video from response — Veo returns response.videos[] not response.predictions[]
    const videos = opResult.response?.videos;
    const predictions = opResult.response?.predictions; // fallback for other models
    
    const videoItem = (videos && videos.length > 0) ? videos[0] : 
                      (predictions && predictions.length > 0) ? predictions[0] : null;

    if (!videoItem) {
      throw new Error('No videos in Veo response: ' + JSON.stringify(opResult.response));
    }

    // Response may contain base64 bytes or a GCS URI
    const gcsUri = videoItem.gcsUri || videoItem.video?.gcsUri;
    if (gcsUri) {
      console.log(`[Omni] Video saved to GCS by Vertex AI: ${gcsUri}`);
      const srcGcsPath = gcsUri.replace('gs://', '').split('/');
      const srcBucket = srcGcsPath[0];
      const srcObject = srcGcsPath.slice(1).join('/');
      if (srcBucket === BUCKET_NAME) {
        return `https://storage.googleapis.com/${BUCKET_NAME}/${srcObject}`;
      }
      return await copyGcsToBucket(srcBucket, srcObject, destinationName);
    }

    const videoBase64 = videoItem.bytesBase64Encoded || videoItem.video?.bytesBase64Encoded;
    if (videoBase64) {
      const videoBuffer = Buffer.from(videoBase64, 'base64');
      console.log(`[Omni] Received video buffer: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      return await uploadVideoToGCS(videoBuffer, destinationName);
    }

    throw new Error('Veo response video item has no gcsUri or bytesBase64Encoded: ' + JSON.stringify(videoItem).slice(0, 200));

  } catch (error: any) {
    console.error(`[Omni Error] Video generation failed:`, error?.message || error);
    throw error;
  }
}

/**
 * Copies a file from any GCS bucket to our destination bucket.
 */
async function copyGcsToBucket(
  srcBucket: string,
  srcObject: string,
  destinationName: string
): Promise<string> {
  if (!storage) throw new Error('GCS storage not configured');

  const src = storage.bucket(srcBucket).file(srcObject);
  const dest = storage.bucket(BUCKET_NAME).file(destinationName);

  await src.copy(dest);

  try {
    await dest.makePublic();
  } catch (e) {
    console.warn('[GCS] makePublic failed for copied file:', e);
  }

  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destinationName}`;
  console.log(`[GCS] Copied to: ${publicUrl}`);
  return publicUrl;
}

/**
 * Uploads a local video file or Buffer to the GCS bucket.
 */
export async function uploadVideoToGCS(
  filePathOrBuffer: string | Buffer,
  destinationName: string
): Promise<string> {
  if (!BUCKET_NAME || !storage) {
    throw new Error('GCS storage not configured. Cannot upload: ' + destinationName);
  }

  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(destinationName);

    if (typeof filePathOrBuffer === 'string') {
      if (!fs.existsSync(filePathOrBuffer)) {
        const fullPath = path.join(process.cwd(), 'public', filePathOrBuffer);
        if (fs.existsSync(fullPath)) {
          filePathOrBuffer = fullPath;
        } else {
          throw new Error(`Local source file not found at ${filePathOrBuffer}`);
        }
      }
      await bucket.upload(filePathOrBuffer, {
        destination: destinationName,
        metadata: { contentType: 'video/mp4', cacheControl: 'public, max-age=31536000' },
      });
    } else {
      await file.save(filePathOrBuffer, {
        metadata: { contentType: 'video/mp4', cacheControl: 'public, max-age=31536000' },
      });
    }

    try {
      await file.makePublic();
    } catch (e) {
      console.warn('[GCS] makePublic failed:', e);
    }

    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destinationName}`;
    console.log(`[GCS] Uploaded to: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error(`[GCS Error] Failed to upload ${destinationName}:`, error);
    throw error;
  }
}

/**
 * @deprecated Templates no longer exist. Use generateVideoWithOmni() instead.
 */
export async function copyTemplateInGCS(
  templateName: string,
  destinationName: string
): Promise<string> {
  throw new Error(`copyTemplateInGCS: Templates no longer exist. Use generateVideoWithOmni() instead. (${templateName} → ${destinationName})`);
}
