# Phase 4: YouTube Clip Import

## Objective
Extend the clipping system to support YouTube videos with timestamp-based clip extraction using yt-dlp, then upload to Google Drive.

---

## Context Files to Read First
1. `src/services/youtube-service.ts` - YouTube download service (COMPLETE)
2. `src/services/youtube-workflow.ts` - YouTube workflow orchestration (COMPLETE)
3. `src/types/youtube.ts` - YouTube type definitions (COMPLETE)
4. `src/services/drive-service.ts` - Existing Drive upload service
5. `src/api/clips.ts` - Existing Twitch clip routes

---

## Dependencies
- Phases 0-3 must be complete (Twitch pipeline working)
- `yt-dlp` installed: `brew install yt-dlp`
- `ffmpeg` installed: `brew install ffmpeg`

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  YouTube URL    │────▶│  yt-dlp         │────▶│  Download MP4   │
│  + Timestamps   │     │  --download-    │     │  (temp file)    │
│                 │     │  sections       │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Shareable      │◀────│  Google Drive   │◀────│  Upload via     │
│  Link           │     │  (date folder)  │     │  Drive API      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Completed Tasks ✅

### Task 1: YouTube Types ✅
**File:** `src/types/youtube.ts`

```typescript
// Key types created:
- YouTubeQuality: '2160' | '1440' | '1080' | '720' | '480' | '360'
- YouTubeClipRequest: { videoUrl, startTime, endTime, quality?, outputName? }
- YouTubeBatchClipRequest: { videoUrl, clips[], quality? }
- YouTubeVideoInfo: { id, title, channel, duration, chapters, etc. }
- YouTubeClipResult: { videoId, title, channel, duration, driveUrl, etc. }
```

### Task 2: YouTube Service ✅
**File:** `src/services/youtube-service.ts`

Key methods:
| Method | Description |
|--------|-------------|
| `extractVideoId(url)` | Parse YouTube URL to video ID |
| `parseTimestamp(ts)` | Convert "1:23:45" to seconds |
| `getVideoInfo(url)` | Fetch metadata via yt-dlp |
| `getTranscript(url)` | Fetch transcript via ScrapCreators |
| `downloadClip(request)` | Download specific timestamp range |
| `downloadVideo(url)` | Download full video |
| `downloadChapter(url, name)` | Download by chapter name |

### Task 3: YouTube Workflow ✅
**File:** `src/services/youtube-workflow.ts`

Key methods:
| Method | Description |
|--------|-------------|
| `importClip(request)` | Full workflow: YouTube → Download → Drive |
| `importBatchClips(request)` | Multiple clips from one video |
| `importChapter(url, name)` | Import by chapter name |
| `previewVideo(url)` | Get metadata without downloading |
| `getTranscript(url)` | Get video transcript |
| `listChapters(url)` | List available chapters |

### Task 4: Test Script ✅
**File:** `scripts/test-youtube.ts`

Tests:
- [x] Video ID extraction from all URL formats
- [x] Timestamp parsing (HH:MM:SS, MM:SS, seconds)
- [x] Video metadata fetch
- [x] Quality detection
- [x] Clip download with ffmpeg fallback

### Task 5: CLI Script ✅
**File:** `scripts/import-youtube-clip.ts`

```bash
npx tsx scripts/import-youtube-clip.ts <youtube-url> <start-time> <end-time> [quality]
```

---

## Remaining Tasks

### Task 6: Add YouTube API Routes

Create/update `src/api/youtube.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { youtubeWorkflowService } from '../services/youtube-workflow';
import { 
  YouTubeClipRequestSchema, 
  YouTubeBatchClipRequestSchema 
} from '../types/youtube';

const router = Router();

/**
 * POST /api/youtube/import
 * Import a YouTube clip to Google Drive
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const parseResult = YouTubeClipRequestSchema.safeParse(req.body);
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

    const result = await youtubeWorkflowService.importClip(parseResult.data);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('YouTube import error:', error);
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
 * POST /api/youtube/import/batch
 * Import multiple clips from the same YouTube video
 */
router.post('/import/batch', async (req: Request, res: Response) => {
  try {
    const parseResult = YouTubeBatchClipRequestSchema.safeParse(req.body);
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

    const result = await youtubeWorkflowService.importBatchClips(parseResult.data);

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
 * POST /api/youtube/preview
 * Get video metadata without downloading
 */
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'videoUrl required' },
      });
    }

    const preview = await youtubeWorkflowService.previewVideo(videoUrl);

    return res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'PREVIEW_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/youtube/chapters
 * List available chapters for a video
 */
router.post('/chapters', async (req: Request, res: Response) => {
  try {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'videoUrl required' },
      });
    }

    const chapters = await youtubeWorkflowService.listChapters(videoUrl);

    return res.status(200).json({
      success: true,
      data: { chapters },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'CHAPTERS_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/youtube/import/chapter
 * Import a specific chapter from a video
 */
router.post('/import/chapter', async (req: Request, res: Response) => {
  try {
    const { videoUrl, chapterName, quality = '1080' } = req.body;
    
    if (!videoUrl || !chapterName) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'videoUrl and chapterName required' },
      });
    }

    const result = await youtubeWorkflowService.importChapter(videoUrl, chapterName, quality);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'CHAPTER_IMPORT_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/youtube/transcript
 * Get video transcript (via ScrapCreators)
 */
router.post('/transcript', async (req: Request, res: Response) => {
  try {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'videoUrl required' },
      });
    }

    const transcript = await youtubeWorkflowService.getTranscript(videoUrl);

    return res.status(200).json({
      success: true,
      data: { transcript },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'TRANSCRIPT_ERROR', message: error.message },
    });
  }
});

export default router;
```

### Task 7: Update Express App

Update `src/index.ts`:

```typescript
import express from 'express';
import { config } from 'dotenv';
import clipsRouter from './api/clips';
import youtubeRouter from './api/youtube';  // Add this

config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: ['twitch', 'youtube', 'drive']
  });
});

// API Routes
app.use('/api/clips', clipsRouter);      // Twitch clips
app.use('/api/youtube', youtubeRouter);  // YouTube clips - Add this

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  Twitch:  POST /api/clips/import`);
  console.log(`  YouTube: POST /api/youtube/import`);
});

export default app;
```

### Task 8: Add API Test Script

Create `scripts/test-youtube-api.ts`:

```typescript
const BASE_URL = 'http://localhost:3000';

async function testYouTubeApi() {
  console.log('=== YouTube API Tests ===\n');

  try {
    // Test 1: Preview
    console.log('1. Testing preview endpoint...');
    const previewRes = await fetch(`${BASE_URL}/api/youtube/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      }),
    });
    const preview = await previewRes.json();
    console.log(`   Success: ${preview.success}`);
    console.log(`   Title: ${preview.data?.title}`);
    console.log(`   Channel: ${preview.data?.channel}\n`);

    // Test 2: Chapters
    console.log('2. Testing chapters endpoint...');
    const chaptersRes = await fetch(`${BASE_URL}/api/youtube/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      }),
    });
    const chapters = await chaptersRes.json();
    console.log(`   Chapters found: ${chapters.data?.chapters?.length || 0}\n`);

    // Test 3: Import clip
    console.log('3. Testing import endpoint (0:00-0:05)...');
    const importRes = await fetch(`${BASE_URL}/api/youtube/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        startTime: '0:00',
        endTime: '0:05',
        quality: '720',
      }),
    });
    const importResult = await importRes.json();
    console.log(`   Success: ${importResult.success}`);
    if (importResult.success) {
      console.log(`   Drive URL: ${importResult.data.driveUrl}`);
    }

    console.log('\n=== YouTube API tests complete! ===');
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Error: Server not running. Start with: npm run dev');
    } else {
      console.error('Test failed:', error);
    }
    process.exit(1);
  }
}

testYouTubeApi();
```

### Task 9: Update package.json Scripts

```json
{
  "scripts": {
    "test:youtube": "npx tsx scripts/test-youtube.ts",
    "test:youtube:api": "npx tsx scripts/test-youtube-api.ts",
    "import:youtube": "npx tsx scripts/import-youtube-clip.ts"
  }
}
```

---

## Success Criteria

- [x] `src/services/youtube-service.ts` handles yt-dlp downloads
- [x] `src/services/youtube-workflow.ts` orchestrates full pipeline
- [x] `src/types/youtube.ts` has proper TypeScript types
- [x] `npm run test:youtube` passes all tests
- [ ] `src/api/youtube.ts` created with routes
- [ ] `npm run dev` serves YouTube endpoints
- [ ] `POST /api/youtube/import` returns Drive URL

---

## Verification Commands

```bash
# Type check
npm run typecheck

# Test YouTube service directly
npm run test:youtube

# CLI import
npm run import:youtube "https://youtube.com/watch?v=VIDEO_ID" "1:00" "2:00"

# Test API (requires server)
npm run dev  # Terminal 1
npm run test:youtube:api  # Terminal 2
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/youtube/import` | Import clip with timestamps |
| POST | `/api/youtube/import/batch` | Import multiple clips from one video |
| POST | `/api/youtube/import/chapter` | Import by chapter name |
| POST | `/api/youtube/preview` | Get video metadata |
| POST | `/api/youtube/chapters` | List video chapters |
| POST | `/api/youtube/transcript` | Get video transcript |

---

## Example Requests

### Import Clip
```bash
curl -X POST http://localhost:3000/api/youtube/import \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://youtube.com/watch?v=VIDEO_ID",
    "startTime": "1:30",
    "endTime": "2:45",
    "quality": "1080"
  }'
```

### Batch Import
```bash
curl -X POST http://localhost:3000/api/youtube/import/batch \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://youtube.com/watch?v=VIDEO_ID",
    "clips": [
      { "startTime": "0:00", "endTime": "0:30", "name": "intro" },
      { "startTime": "5:00", "endTime": "5:45", "name": "highlight" }
    ],
    "quality": "720"
  }'
```

### Import Chapter
```bash
curl -X POST http://localhost:3000/api/youtube/import/chapter \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://youtube.com/watch?v=VIDEO_ID",
    "chapterName": "Introduction",
    "quality": "1080"
  }'
```

---

## Expected Response

```json
{
  "success": true,
  "data": {
    "videoId": "VIDEO_ID",
    "title": "Video Title",
    "channel": "Channel Name",
    "startTime": "1:30",
    "endTime": "2:45",
    "duration": 75,
    "quality": "1080",
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
git commit -m "Phase 4: YouTube clip import with yt-dlp integration"
```

---

## Next Phase

After Phase 4, consider:
- **Phase 5:** VOD multi-clip extraction
- **Phase 6:** AI auto-clipping integration
- **Phase 7:** Whop webhook triggers
