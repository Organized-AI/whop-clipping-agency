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
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    // Import the clip
    const result = await clipWorkflowService.importClip(parseResult.data);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Clip import error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'IMPORT_ERROR',
        message: errorMessage,
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
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    const result = await clipWorkflowService.importClips(parseResult.data.clips);

    res.status(200).json({
      success: true,
      data: {
        imported: result.success.length,
        failed: result.failed.length,
        results: result.success,
        errors: result.failed,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Batch import error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_IMPORT_ERROR',
        message: errorMessage,
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
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    const preview = await clipWorkflowService.previewClip(
      parseResult.data.clipUrl,
      parseResult.data.quality
    );

    res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Preview error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREVIEW_ERROR',
        message: errorMessage,
      },
    });
  }
});

export default router;
