import { Router, Request, Response } from 'express';
import { highlightDetectionService } from '../services/highlight-detection';
import { vodService } from '../services/vod-service';
import {
  DetectHighlightsRequestSchema,
  ExtractClipsRequestSchema
} from '../types/highlights';

const router = Router();

/**
 * POST /api/vod/detect
 * Detect highlights in a dev stream VOD
 */
router.post('/detect', async (req: Request, res: Response) => {
  try {
    const parseResult = DetectHighlightsRequestSchema.safeParse(req.body);
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

    const result = await highlightDetectionService.detectHighlights(parseResult.data);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Highlight detection error:', errorMessage);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DETECTION_ERROR',
        message: errorMessage,
      },
    });
  }
});

/**
 * POST /api/vod/detect/quick
 * Quick detection using transcript only (faster)
 */
router.post('/detect/quick', async (req: Request, res: Response) => {
  try {
    const { vodUrl, maxClips = 10 } = req.body;

    if (!vodUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'vodUrl required' },
      });
    }

    const highlights = await highlightDetectionService.quickDetect(vodUrl, maxClips);

    return res.status(200).json({
      success: true,
      data: { highlights },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: { code: 'DETECTION_ERROR', message: errorMessage },
    });
  }
});

/**
 * POST /api/vod/extract
 * Extract multiple clips from a VOD
 */
router.post('/extract', async (req: Request, res: Response) => {
  try {
    const parseResult = ExtractClipsRequestSchema.safeParse(req.body);
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

    const result = await vodService.extractClips(parseResult.data);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Clip extraction error:', errorMessage);
    return res.status(500).json({
      success: false,
      error: {
        code: 'EXTRACTION_ERROR',
        message: errorMessage,
      },
    });
  }
});

/**
 * POST /api/vod/detect-and-extract
 * Full workflow: Detect highlights then extract all
 */
router.post('/detect-and-extract', async (req: Request, res: Response) => {
  try {
    const { vodUrl, maxClips = 10, minScore = 3, quality = '1080' } = req.body;

    if (!vodUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'vodUrl required' },
      });
    }

    // Step 1: Detect highlights
    console.log('Step 1: Detecting highlights...');
    const detection = await highlightDetectionService.detectHighlights({
      vodUrl,
      options: { maxClips, minScore },
    });

    if (detection.highlights.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'No highlights detected above threshold',
          detection,
          extraction: null,
        },
      });
    }

    // Step 2: Extract detected highlights
    console.log('Step 2: Extracting clips...');
    const clips = detection.highlights.map((h, i) => ({
      startTime: Math.floor(h.startTime).toString(),
      endTime: Math.ceil(h.endTime).toString(),
      name: `${h.clipType}-${i + 1}`,
      type: h.clipType,
    }));

    const extraction = await vodService.extractClips({
      vodUrl,
      clips,
      quality: quality as '2160' | '1440' | '1080' | '720' | '480',
    });

    return res.status(200).json({
      success: true,
      data: {
        detection,
        extraction,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: { code: 'WORKFLOW_ERROR', message: errorMessage },
    });
  }
});

export default router;
