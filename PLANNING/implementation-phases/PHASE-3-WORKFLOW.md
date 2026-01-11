# Phase 3: Workflow Integration & API

## Objective
Create the orchestration service that ties ScrapCreators and Google Drive together, plus the Express API endpoint for importing clips.

---

## Context Files to Read First
1. `src/services/scrapcreators-service.ts` - Clip fetching
2. `src/services/drive-service.ts` - Drive upload
3. `src/types/clips.ts` - Type definitions
4. `src/index.ts` - Express app entry point

---

## Dependencies
- Phase 1 must be complete (ScrapCreators service working)
- Phase 2 must be complete (Drive service working)
- Both test scripts passing

---

## Tasks

### Task 1: Create Clip Workflow Service

Create `src/services/clip-workflow.ts`:

```typescript
import { scrapCreatorsService } from './scrapcreators-service';
import { driveService } from './drive-service';
import { 
  ImportClipRequest, 
  ClipImportResult, 
  VideoQuality,
  ProcessedClip 
} from '../types/clips';

export class ClipWorkflowService {
  /**
   * Full workflow: Fetch clip → Download → Upload to Drive
   */
  async importClip(request: ImportClipRequest): Promise<ClipImportResult> {
    const { clipUrl, quality = '1080' } = request;
    let localPath: string | undefined;

    try {
      console.log('\n=== Starting Clip Import ===');
      console.log(`URL: ${clipUrl}`);
      console.log(`Quality: ${quality}p`);

      // Step 1: Fetch clip data from ScrapCreators
      console.log('\n[1/4] Fetching clip data...');
      const apiResponse = await scrapCreatorsService.fetchClipData(clipUrl);
      const creditsRemaining = apiResponse.credits_remaining;
      console.log(`Credits remaining: ${creditsRemaining}`);

      // Step 2: Process clip data
      console.log('\n[2/4] Processing clip data...');
      const processedClip = scrapCreatorsService.processClipData(apiResponse, quality as VideoQuality);
      console.log(`Title: ${processedClip.title}`);
      console.log(`Broadcaster: ${processedClip.broadcaster}`);
      console.log(`Duration: ${processedClip.duration}s`);

      // Step 3: Download video
      console.log('\n[3/4] Downloading video...');
      localPath = await scrapCreatorsService.downloadVideo(processedClip);
      console.log(`Downloaded to: ${localPath}`);

      // Step 4: Upload to Google Drive
      console.log('\n[4/4] Uploading to Google Drive...');
      const uploadResult = await driveService.uploadClip(
        localPath,
        processedClip.title,
        processedClip.broadcasterLogin,
        processedClip.createdAt
      );

      console.log('\n=== Import Complete ===');
      console.log(`Drive URL: ${uploadResult.webViewLink}`);

      return {
        clipId: processedClip.slug,
        title: processedClip.title,
        duration: processedClip.duration,
        broadcaster: processedClip.broadcaster,
        driveFileId: uploadResult.fileId,
        driveUrl: uploadResult.webViewLink,
        folder: uploadResult.folder,
      };
    } finally {
      // Always cleanup temp file
      if (localPath) {
        console.log('\nCleaning up temp file...');
        scrapCreatorsService.cleanupTempFile(localPath);
      }
    }
  }

  /**
   * Batch import multiple clips
   */
  async importClips(
    requests: ImportClipRequest[]
  ): Promise<{ success: ClipImportResult[]; failed: Array<{ url: string; error: string }> }> {
    const success: ClipImportResult[] = [];
    const failed: Array<{ url: string; error: string }> = [];

    for (const request of requests) {
      try {
        const result = await this.importClip(request);
        success.push(result);
      } catch (error: any) {
        failed.push({
          url: request.clipUrl,
          error: error.message,
        });
        console.error(`Failed to import ${request.clipUrl}:`, error.message);
      }
    }

    return { success, failed };
  }

  /**
   * Preview clip without downloading/uploading
   */
  async previewClip(clipUrl: string, quality: VideoQuality = '1080'): Promise<ProcessedClip> {
    const apiResponse = await scrapCreatorsService.fetchClipData(clipUrl);
    return scrapCreatorsService.processClipData(apiResponse, quality);
  }
}

// Export singleton instance
export const clipWorkflowService = new ClipWorkflowService();
```

### Task 2: Create Clips API Route

Create `src/api/clips.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { clipWorkflowService } from '../services/clip-workflow';
import { ImportClipRequestSchema } from '../types/clips';

const router = Router();

/**
 * POST /api/clips/import
 * Import a single Twitch clip to Google Drive
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const parseResult = ImportClipRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten(),
        },
      });
    }

    // Import the clip
    const result = await clipWorkflowService.importClip(parseResult.data);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Clip import error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'IMPORT_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/clips/import/batch
 * Import multiple Twitch clips to Google Drive
 */
const BatchImportSchema = z.object({
  clips: z.array(ImportClipRequestSchema).min(1).max(10),
});

router.post('/import/batch', async (req: Request, res: Response) => {
  try {
    const parseResult = BatchImportSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten(),
        },
      });
    }

    const result = await clipWorkflowService.importClips(parseResult.data.clips);

    return res.status(200).json({
      success: true,
      data: {
        imported: result.success.length,
        failed: result.failed.length,
        results: result.success,
        errors: result.failed,
      },
    });
  } catch (error: any) {
    console.error('Batch import error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_IMPORT_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/clips/preview
 * Preview clip metadata without importing
 */
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const parseResult = ImportClipRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten(),
        },
      });
    }

    const preview = await clipWorkflowService.previewClip(
      parseResult.data.clipUrl,
      parseResult.data.quality
    );

    return res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (error: any) {
    console.error('Preview error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PREVIEW_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
```

### Task 3: Update Express app to include clips routes

Update `src/index.ts` to add the clips router:

```typescript
import express from 'express';
import { config } from 'dotenv';
import clipsRouter from './api/clips';

config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/clips', clipsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Clip import: POST http://localhost:${PORT}/api/clips/import`);
});

export default app;
```

### Task 4: Create end-to-end test script

Create `scripts/test-workflow.ts`:

```typescript
import { clipWorkflowService } from '../src/services/clip-workflow';

async function testWorkflow() {
  const testUrl = 'https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4';

  console.log('=== End-to-End Workflow Test ===\n');

  try {
    // Test 1: Preview (no download/upload)
    console.log('1. Testing preview (no credits used for download)...');
    const preview = await clipWorkflowService.previewClip(testUrl);
    console.log(`   Title: ${preview.title}`);
    console.log(`   Broadcaster: ${preview.broadcaster}`);
    console.log(`   Duration: ${preview.duration}s\n`);

    // Test 2: Full import
    console.log('2. Testing full import workflow...');
    const result = await clipWorkflowService.importClip({
      clipUrl: testUrl,
      quality: '1080',
    });

    console.log('\n=== Import Result ===');
    console.log(`Clip ID: ${result.clipId}`);
    console.log(`Title: ${result.title}`);
    console.log(`Broadcaster: ${result.broadcaster}`);
    console.log(`Duration: ${result.duration}s`);
    console.log(`Drive File ID: ${result.driveFileId}`);
    console.log(`Drive URL: ${result.driveUrl}`);
    console.log(`Folder: ${result.folder}`);

    console.log('\n=== Workflow test passed! ===');
  } catch (error) {
    console.error('Workflow test failed:', error);
    process.exit(1);
  }
}

testWorkflow();
```

### Task 5: Create API test script

Create `scripts/test-api.ts`:

```typescript
const BASE_URL = 'http://localhost:3000';

async function testApi() {
  console.log('=== API Endpoint Tests ===\n');
  console.log('Make sure the server is running: npm run dev\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log(`   Status: ${health.status}\n`);

    // Test 2: Preview endpoint
    console.log('2. Testing preview endpoint...');
    const previewRes = await fetch(`${BASE_URL}/api/clips/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clipUrl: 'https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4',
      }),
    });
    const preview = await previewRes.json();
    console.log(`   Success: ${preview.success}`);
    console.log(`   Title: ${preview.data?.title}\n`);

    // Test 3: Import endpoint
    console.log('3. Testing import endpoint...');
    const importRes = await fetch(`${BASE_URL}/api/clips/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clipUrl: 'https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4',
        quality: '720', // Use 720p to save bandwidth
      }),
    });
    const importResult = await importRes.json();
    console.log(`   Success: ${importResult.success}`);
    if (importResult.success) {
      console.log(`   Drive URL: ${importResult.data.driveUrl}`);
      console.log(`   Folder: ${importResult.data.folder}`);
    } else {
      console.log(`   Error: ${importResult.error?.message}`);
    }

    console.log('\n=== API tests complete! ===');
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Error: Server not running. Start it with: npm run dev');
    } else {
      console.error('Test failed:', error);
    }
    process.exit(1);
  }
}

testApi();
```

### Task 6: Update package.json scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "npx tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "test:scrapcreators": "npx tsx scripts/test-scrapcreators.ts",
    "test:drive": "npx tsx scripts/test-drive.ts",
    "test:workflow": "npx tsx scripts/test-workflow.ts",
    "test:api": "npx tsx scripts/test-api.ts",
    "test:all": "npm run test:scrapcreators && npm run test:drive && npm run test:workflow"
  }
}
```

---

## Success Criteria

- [ ] `src/services/clip-workflow.ts` created
- [ ] `src/api/clips.ts` created with routes
- [ ] `src/index.ts` updated with clips router
- [ ] `npm run typecheck` passes
- [ ] `npm run test:workflow` completes full import
- [ ] `npm run dev` starts server
- [ ] `POST /api/clips/import` returns success with Drive URL

---

## Verification Commands

```bash
# Type check
npm run typecheck

# Test workflow directly
npm run test:workflow

# Test API (requires server running)
# Terminal 1:
npm run dev

# Terminal 2:
npm run test:api

# Or use curl:
curl -X POST http://localhost:3000/api/clips/import \
  -H "Content-Type: application/json" \
  -d '{"clipUrl": "https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4"}'
```

---

## Expected API Response

```json
{
  "success": true,
  "data": {
    "clipId": "SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4",
    "title": "Creative Suite Hack",
    "duration": 46,
    "broadcaster": "jordaaanhill",
    "driveFileId": "1abc123xyz",
    "driveUrl": "https://drive.google.com/file/d/1abc123xyz/view",
    "folder": "2026-01-11"
  }
}
```

---

## Git Commit

```bash
git add -A
git commit -m "Phase 3: Workflow integration and API endpoints"
```

---

## Integration Complete! 🎉

After Phase 3, you have a fully functional ScrapCreators → Google Drive pipeline:

1. **Single clip import:** `POST /api/clips/import`
2. **Batch import:** `POST /api/clips/import/batch`
3. **Preview metadata:** `POST /api/clips/preview`

All clips are automatically organized into date folders in your shared Google Drive folder.
