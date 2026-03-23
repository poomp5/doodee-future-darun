import { uploadToR2, UploadResult } from './r2-upload';

const R2_UNIVERSITY_PREFIX = 'doodee-future-darun/university';

/**
 * Download university logo from MYTCAS and upload to R2
 * @param universityId - University ID (e.g., "001", "002")
 * @returns UploadResult with R2 URL or error
 */
export async function downloadAndUploadUniversityLogo(
  universityId: string
): Promise<UploadResult> {
  try {
    const mytcasUrl = `https://assets.mytcas.com/i/logo/${universityId}.png`;

    console.log(`Fetching logo for university ${universityId} from ${mytcasUrl}`);

    // Download logo from MYTCAS
    const response = await fetch(mytcasUrl);

    if (!response.ok) {
      console.warn(`Failed to fetch logo for university ${universityId}: ${response.status}`);
      return {
        success: false,
        error: `Failed to download logo: ${response.status} ${response.statusText}`,
      };
    }

    // Get buffer from response
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2 with specific path: /doodee-future-darun/university/{uni_id}.png
    const fileName = `${universityId}.png`;
    const key = `${R2_UNIVERSITY_PREFIX}/${universityId}.png`;

    console.log(`Uploading logo to R2: ${key}`);

    // Use custom key instead of auto-generated one
    const result = await uploadToR2WithCustomKey(buffer, key, 'image/png');

    if (result.success) {
      console.log(`Successfully uploaded logo for university ${universityId} to ${result.url}`);
    } else {
      console.error(`Failed to upload logo for university ${universityId}:`, result.error);
    }

    return result;
  } catch (error) {
    console.error(`Error processing logo for university ${universityId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload to R2 with custom key (no UUID generation)
 */
async function uploadToR2WithCustomKey(
  file: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  try {
    if (!process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
      throw new Error('R2 configuration missing');
    }

    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return {
      success: true,
      url: publicUrl,
      key: key,
    };
  } catch (error) {
    console.error('R2 Upload Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Batch download and upload multiple university logos
 * @param universityIds - Array of university IDs
 * @param concurrency - Number of concurrent downloads (default: 5)
 * @returns Array of UploadResults
 */
export async function batchDownloadAndUploadLogos(
  universityIds: string[],
  concurrency: number = 5
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  // Process in batches to avoid overwhelming the server
  for (let i = 0; i < universityIds.length; i += concurrency) {
    const batch = universityIds.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(id => downloadAndUploadUniversityLogo(id))
    );
    results.push(...batchResults);

    // Log progress
    console.log(`Processed ${Math.min(i + concurrency, universityIds.length)} / ${universityIds.length} logos`);
  }

  return results;
}

/**
 * Cache for downloaded logos to avoid re-downloading for multiple programs from same university
 */
const logoCache = new Map<string, UploadResult>();

/**
 * Download and upload logo with caching
 */
export async function downloadAndUploadUniversityLogoWithCache(
  universityId: string
): Promise<UploadResult> {
  // Check cache first
  if (logoCache.has(universityId)) {
    console.log(`Using cached logo for university ${universityId}`);
    return logoCache.get(universityId)!;
  }

  // Download and upload
  const result = await downloadAndUploadUniversityLogo(universityId);

  // Cache successful results
  if (result.success) {
    logoCache.set(universityId, result);
  }

  return result;
}

/**
 * Clear logo cache
 */
export function clearLogoCache(): void {
  logoCache.clear();
  console.log('Logo cache cleared');
}
