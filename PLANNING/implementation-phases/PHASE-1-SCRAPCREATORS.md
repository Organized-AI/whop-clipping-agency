# Phase 1: ScrapCreators Service

## Objective
Build the ScrapCreators API service to fetch Twitch clip data and download video files.

---

## Context Files to Read First
1. `src/config/clips-config.ts` - Configuration loader
2. `PLANNING/SCRAPCREATORS-DRIVE-MASTER-PLAN.md` - API reference

---

## Dependencies
- Phase 0 must be complete
- `npm run typecheck` passes

---

## Tasks

### Task 1: Create clip types

Create `src/types/clips.ts`:

```typescript
import { z } from 'zod';

// Video quality options
export type VideoQuality = '1080' | '720' | '480' | '360';

// ScrapCreators API Response Schema
export const ScrapCreatorsClipSchema = z.object({
  id: z.string(),
  slug: z.string(),
  url: z.string().url(),
  embedURL: z.string().url(),
  title: z.string(),
  viewCount: z.number(),
  language: z.string(),
  durationSeconds: z.number(),
  createdAt: z.string(),
  thumbnailURL: z.string().url(),
  videoURL: z.string().url().optional(),
  broadcaster: z.object({
    id: z.string(),
    login: z.string(),
    displayName: z.string(),
  }),
  game: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable(),
  videoQualities: z.array(z.object({
    quality: z.string(),
    sourceURL: z.string().url(),
    frameRate: z.number().optional(),
  })).optional(),
  assets: z.array(z.object({
    id: z.string(),
    type: z.string(),
    thumbnailURL: z.string().url(),
    videoQualities: z.array(z.object({
      quality: z.string(),
      sourceURL: z.string().url(),
      frameRate: z.number().optional(),
    })),
  })).optional(),
});

export type ScrapCreatorsClip = z.infer<typeof ScrapCreatorsClipSchema>;

// API Response wrapper
export const ScrapCreatorsResponseSchema = z.object({
  '0': z.object({
    data: z.object({
      clip: ScrapCreatorsClipSchema,
    }),
  }),
  success: z.boolean(),
  credits_remaining: z.number().optional(),
});

export type ScrapCreatorsResponse = z.infer<typeof ScrapCreatorsResponseSchema>;

// Processed clip data for internal use
export interface ProcessedClip {
  id: string;
  slug: string;
  title: string;
  duration: number;
  broadcaster: string;
  broadcasterLogin: string;
  game: string | null;
  thumbnailUrl: string;
  videoUrl: string;
  quality: VideoQuality;
  createdAt: Date;
}

// Import request schema
export const ImportClipRequestSchema = z.object({
  clipUrl: z.string().url().refine(
    (url) => url.includes('twitch.tv') || url.includes('clips.twitch.tv'),
    { message: 'Must be a valid Twitch clip URL' }
  ),
  quality: z.enum(['1080', '720', '480', '360']).optional().default('1080'),
});

export type ImportClipRequest = z.infer<typeof ImportClipRequestSchema>;

// Import result
export interface ClipImportResult {
  clipId: string;
  title: string;
  duration: number;
  broadcaster: string;
  driveFileId: string;
  driveUrl: string;
  folder: string;
  localPath?: string;
}
```

### Task 2: Create ScrapCreators service

Create `src/services/scrapcreators-service.ts`:

```typescript
import { clipsConfig } from '../config/clips-config';
import { 
  ScrapCreatorsResponse, 
  ScrapCreatorsResponseSchema,
  ProcessedClip,
  VideoQuality 
} from '../types/clips';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ScrapCreatorsService {
  private apiKey: string;
  private apiUrl: string;
  private tempPath: string;

  constructor() {
    this.apiKey = clipsConfig.scrapcreators.apiKey;
    this.apiUrl = clipsConfig.scrapcreators.apiUrl;
    this.tempPath = clipsConfig.clips.tempDownloadPath;
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempPath)) {
      fs.mkdirSync(this.tempPath, { recursive: true });
    }
  }

  /**
   * Extract clip slug from Twitch URL
   */
  extractSlug(clipUrl: string): string {
    // Handle various Twitch clip URL formats:
    // https://clips.twitch.tv/SlugName
    // https://www.twitch.tv/channel/clip/SlugName
    // https://clips.twitch.tv/create/SlugName
    
    const patterns = [
      /clips\.twitch\.tv\/create\/([A-Za-z0-9_-]+)/,
      /clips\.twitch\.tv\/([A-Za-z0-9_-]+)/,
      /twitch\.tv\/\w+\/clip\/([A-Za-z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = clipUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    throw new Error(`Could not extract clip slug from URL: ${clipUrl}`);
  }

  /**
   * Fetch clip data from ScrapCreators API
   */
  async fetchClipData(clipUrl: string): Promise<ScrapCreatorsResponse> {
    const slug = this.extractSlug(clipUrl);
    
    const response = await fetch(`${this.apiUrl}/twitch/clip?handle=${slug}`, {
      method: 'GET',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ScrapCreators API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate response
    const parsed = ScrapCreatorsResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('API Response validation failed:', parsed.error);
      throw new Error('Invalid API response format');
    }

    return parsed.data;
  }

  /**
   * Find the best video URL for requested quality
   */
  findVideoUrl(response: ScrapCreatorsResponse, quality: VideoQuality): string {
    const clip = response['0'].data.clip;
    
    // First check if videoURL is directly available with auth token
    if (clip.videoURL) {
      return clip.videoURL;
    }

    // Check assets for SOURCE type with matching quality
    if (clip.assets && clip.assets.length > 0) {
      const sourceAsset = clip.assets.find(a => a.type === 'SOURCE');
      if (sourceAsset && sourceAsset.videoQualities) {
        const qualityMatch = sourceAsset.videoQualities.find(
          vq => vq.quality === quality
        );
        if (qualityMatch) {
          return qualityMatch.sourceURL;
        }
        // Fallback to highest quality available
        return sourceAsset.videoQualities[0]?.sourceURL || '';
      }
    }

    // Check videoQualities array directly
    if (clip.videoQualities && clip.videoQualities.length > 0) {
      const qualityMatch = clip.videoQualities.find(
        vq => vq.quality === quality
      );
      if (qualityMatch) {
        return qualityMatch.sourceURL;
      }
      // Fallback to first available
      return clip.videoQualities[0]?.sourceURL || '';
    }

    throw new Error('No video URL found in API response');
  }

  /**
   * Process API response into clean clip data
   */
  processClipData(response: ScrapCreatorsResponse, quality: VideoQuality): ProcessedClip {
    const clip = response['0'].data.clip;
    const videoUrl = this.findVideoUrl(response, quality);

    return {
      id: clip.id,
      slug: clip.slug,
      title: clip.title,
      duration: clip.durationSeconds,
      broadcaster: clip.broadcaster.displayName,
      broadcasterLogin: clip.broadcaster.login,
      game: clip.game?.name || null,
      thumbnailUrl: clip.thumbnailURL,
      videoUrl,
      quality,
      createdAt: new Date(clip.createdAt),
    };
  }

  /**
   * Download video file to temp directory
   */
  async downloadVideo(processedClip: ProcessedClip): Promise<string> {
    const filename = `${processedClip.slug}-${processedClip.quality}p-${uuidv4().slice(0, 8)}.mp4`;
    const filepath = path.join(this.tempPath, filename);

    console.log(`Downloading clip: ${processedClip.title}`);
    console.log(`From: ${processedClip.videoUrl}`);
    console.log(`To: ${filepath}`);

    const response = await fetch(processedClip.videoUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));

    const stats = fs.statSync(filepath);
    console.log(`Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    return filepath;
  }

  /**
   * Clean up temp file
   */
  cleanupTempFile(filepath: string): void {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`Cleaned up: ${filepath}`);
    }
  }

  /**
   * Get remaining API credits
   */
  async getCreditsRemaining(response: ScrapCreatorsResponse): Promise<number | null> {
    return response.credits_remaining ?? null;
  }
}

// Export singleton instance
export const scrapCreatorsService = new ScrapCreatorsService();
```

### Task 3: Create test script

Create `scripts/test-scrapcreators.ts`:

```typescript
import { scrapCreatorsService } from '../src/services/scrapcreators-service';

async function testScrapCreators() {
  const testUrl = 'https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4';
  
  console.log('=== ScrapCreators Service Test ===\n');

  try {
    // Test 1: Extract slug
    console.log('1. Testing slug extraction...');
    const slug = scrapCreatorsService.extractSlug(testUrl);
    console.log(`   Extracted slug: ${slug}\n`);

    // Test 2: Fetch clip data
    console.log('2. Fetching clip data from API...');
    const response = await scrapCreatorsService.fetchClipData(testUrl);
    console.log(`   Success: ${response.success}`);
    console.log(`   Credits remaining: ${response.credits_remaining}\n`);

    // Test 3: Process clip data
    console.log('3. Processing clip data...');
    const processedClip = scrapCreatorsService.processClipData(response, '1080');
    console.log(`   Title: ${processedClip.title}`);
    console.log(`   Broadcaster: ${processedClip.broadcaster}`);
    console.log(`   Duration: ${processedClip.duration}s`);
    console.log(`   Video URL: ${processedClip.videoUrl.slice(0, 80)}...\n`);

    // Test 4: Download video (optional - comment out to save credits)
    console.log('4. Downloading video...');
    const localPath = await scrapCreatorsService.downloadVideo(processedClip);
    console.log(`   Downloaded to: ${localPath}\n`);

    // Cleanup
    console.log('5. Cleaning up...');
    scrapCreatorsService.cleanupTempFile(localPath);
    console.log('   Done!\n');

    console.log('=== All tests passed! ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testScrapCreators();
```

### Task 4: Add test script to package.json

Add to `scripts` in `package.json`:

```json
{
  "scripts": {
    "test:scrapcreators": "npx tsx scripts/test-scrapcreators.ts"
  }
}
```

---

## Success Criteria

- [ ] `src/types/clips.ts` created with all type definitions
- [ ] `src/services/scrapcreators-service.ts` created and exports singleton
- [ ] `npm run typecheck` passes
- [ ] `npm run test:scrapcreators` successfully:
  - Extracts slug from URL
  - Fetches data from API
  - Processes clip data
  - Downloads video file
  - Cleans up temp file

---

## Verification Commands

```bash
npm run typecheck
npm run test:scrapcreators
```

Expected output:
```
=== ScrapCreators Service Test ===

1. Testing slug extraction...
   Extracted slug: SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4

2. Fetching clip data from API...
   Success: true
   Credits remaining: 91

3. Processing clip data...
   Title: Creative Suite Hack
   Broadcaster: jordaaanhill
   Duration: 46s
   ...

=== All tests passed! ===
```

---

## Git Commit

```bash
git add -A
git commit -m "Phase 1: ScrapCreators service with clip fetch and download"
```

---

## Next Phase

After completing all tasks and verification, proceed to:
`PLANNING/implementation-phases/PHASE-2-DRIVE-SERVICE.md`
