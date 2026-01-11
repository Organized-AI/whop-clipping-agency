import { scrapCreatorsService } from './scrapcreators-service';
import { getDriveService } from './drive-service';
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
      const driveService = getDriveService();
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failed.push({
          url: request.clipUrl,
          error: errorMessage,
        });
        console.error(`Failed to import ${request.clipUrl}:`, errorMessage);
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
