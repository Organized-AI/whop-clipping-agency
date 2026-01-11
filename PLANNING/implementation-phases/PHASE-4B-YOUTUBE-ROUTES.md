# Phase 4b: YouTube API Routes

## Objective
Add Express.js API routes for YouTube clip import, completing the YouTube pipeline.

---

## Prerequisites
- Phase 4a complete (YouTube service and workflow exist)
- `yt-dlp` and `ffmpeg` installed

---

## Context Files to Read First
1. `src/services/youtube-workflow.ts` - Available workflow methods
2. `src/types/youtube.ts` - Request/response types
3. `src/api/clips.ts` - Pattern to follow from Twitch routes

---

## Tasks

### Task 1: Create YouTube API Routes

Create `src/api/youtube.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { youtubeWorkflowService } from '../services/youtube-workflow';
import { 
  YouTubeClipRequestSchema,
  YouTubeBatchClipRequestSchema 
} from '../types/youtube';

const router = Router();

/**
 * POST /api/youtube/import
 * Import a single YouTube clip with timestamps
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
 * Import multiple clips from same video
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
      data: result,
    });
  } catch (error: any) {
    console.error('YouTube batch import error:', error);
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
 * POST /api/youtube/import/chapter
 * Import a specific chapter from video
 */
router.post('/import/chapter', async (req: Request, res: Response) => {
  try {
    const { videoUrl, chapterName, quality } = req.body;

    if (!videoUrl || !chapterName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'videoUrl and chapterName are required',
        },
      });
    }

    const result = await youtubeWorkflowService.importChapter(
      videoUrl,
      chapterName,
      quality
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Chapter import error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CHAPTER_IMPORT_ERROR',
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
        error: {
          code: 'VALIDATION_ERROR',
          message: 'videoUrl is required',
        },
      });
    }

    const preview = await youtubeWorkflowService.previewVideo(videoUrl);

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

/**
 * POST /api/youtube/chapters
 * List chapters in a video
 */
router.post('/chapters', async (req: Request, res: Response) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'videoUrl is required',
        },
      });
    }

    const chapters = await youtubeWorkflowService.listChapters(videoUrl);

    return res.status(200).json({
      success: true,
      data: { chapters },
    });
  } catch (error: any) {
    console.error('Chapters error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CHAPTERS_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/youtube/transcript
 * Get video transcript
 */
router.post('/transcript', async (req: Request, res: Response) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'videoUrl is required',
        },
      });
    }

    const transcript = await youtubeWorkflowService.getTranscript(videoUrl);

    return res.status(200).json({
      success: true,
      data: { transcript },
    });
  } catch (error: any) {
    console.error('Transcript error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TRANSCRIPT_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
```

---

### Task 2: Update index.ts

Add YouTube routes to `src/index.ts`:

```typescript
import "dotenv/config";
import express from "express";
import clipsRouter from "./api/clips";
import youtubeRouter from "./api/youtube";  // Add this

const app = express();
const PORT = process.env.PORT || 3000;

// ... existing middleware ...

// API Routes
app.use("/api/clips", clipsRouter);
app.use("/api/youtube", youtubeRouter);  // Add this

// ... rest of file ...

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Twitch clips: POST http://localhost:${PORT}/api/clips/import`);
  console.log(`YouTube clips: POST http://localhost:${PORT}/api/youtube/import`);  // Add this
});
```

---

### Task 3: Add Zod Schemas (if not in types)

Verify `src/types/youtube.ts` has these schemas:

```typescript
import { z } from 'zod';

export const YouTubeClipRequestSchema = z.object({
  videoUrl: z.string().url(),
  startTime: z.string(),
  endTime: z.string(),
  quality: z.enum(['2160', '1440', '1080', '720', '480', '360']).optional(),
  outputName: z.string().optional(),
});

export const YouTubeBatchClipRequestSchema = z.object({
  videoUrl: z.string().url(),
  clips: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
    name: z.string().optional(),
  })).min(1).max(20),
  quality: z.enum(['2160', '1440', '1080', '720', '480', '360']).optional(),
});
```

---

## Success Criteria

- [ ] `src/api/youtube.ts` created
- [ ] `src/index.ts` updated with YouTube routes
- [ ] `npm run typecheck` passes
- [ ] Server starts with `npm run dev`
- [ ] `POST /api/youtube/preview` returns video info
- [ ] `POST /api/youtube/import` downloads and uploads clip

---

## Verification Commands

```bash
# Type check
npm run typecheck

# Start server
npm run dev

# Test preview
curl -X POST http://localhost:3000/api/youtube/preview \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ"}'

# Test import
curl -X POST http://localhost:3000/api/youtube/import \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://youtube.com/watch?v=VIDEO_ID",
    "startTime": "0:00",
    "endTime": "0:30",
    "quality": "720"
  }'
```

---

## Git Commit

```bash
git add -A
git commit -m "Phase 4b: YouTube API routes"
```
