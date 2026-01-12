import { Router, Request, Response } from 'express';
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('YouTube import error:', errorMessage);
    return res.status(500).json({
      success: false,
      error: {
        code: 'IMPORT_ERROR',
        message: errorMessage,
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('YouTube batch import error:', errorMessage);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_IMPORT_ERROR',
        message: errorMessage,
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chapter import error:', errorMessage);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CHAPTER_IMPORT_ERROR',
        message: errorMessage,
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Preview error:', errorMessage);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PREVIEW_ERROR',
        message: errorMessage,
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chapters error:', errorMessage);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CHAPTERS_ERROR',
        message: errorMessage,
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Transcript error:', errorMessage);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TRANSCRIPT_ERROR',
        message: errorMessage,
      },
    });
  }
});

export default router;
