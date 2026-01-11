import { youtubeService } from './youtube-service';
import { getDriveService } from './drive-service';
import {
  YouTubeClipRequest,
  YouTubeClipResult,
  YouTubeQuality,
  YouTubeBatchClipRequest,
  YouTubeVideoInfo,
} from '../types/youtube';

export class YouTubeWorkflowService {
  /**
   * Full workflow: Download YouTube clip → Upload to Drive
   */
  async importClip(request: YouTubeClipRequest): Promise<YouTubeClipResult> {
    const { videoUrl, startTime, endTime, quality = '1080' } = request;
    let localPath: string | undefined;

    try {
      console.log('\n=== Starting YouTube Clip Import ===');
      console.log(`URL: ${videoUrl}`);
      console.log(`Range: ${startTime} → ${endTime}`);
      console.log(`Quality: ${quality}p`);

      // Step 1: Get video metadata
      console.log('\n[1/3] Fetching video metadata...');
      const videoInfo = await youtubeService.getVideoInfo(videoUrl);
      console.log(`Title: ${videoInfo.title}`);
      console.log(`Channel: ${videoInfo.channel}`);
      console.log(`Duration: ${videoInfo.durationString}`);

      // Step 2: Download clip
      console.log('\n[2/3] Downloading clip...');
      localPath = await youtubeService.downloadClip(request);
      console.log(`Downloaded to: ${localPath}`);

      // Step 3: Upload to Google Drive
      console.log('\n[3/3] Uploading to Google Drive...');
      const driveService = getDriveService();
      
      // Create descriptive filename
      const clipName = `${videoInfo.channel}-${startTime.replace(/:/g, '')}-${endTime.replace(/:/g, '')}`;
      
      const uploadResult = await driveService.uploadClip(
        localPath,
        `${videoInfo.title} [${startTime}-${endTime}]`,
        videoInfo.channel.replace(/[^a-zA-Z0-9]/g, ''),
        new Date()
      );

      console.log('\n=== Import Complete ===');
      console.log(`Drive URL: ${uploadResult.webViewLink}`);

      // Calculate clip duration
      const startSec = youtubeService.parseTimestamp(startTime);
      const endSec = youtubeService.parseTimestamp(endTime);

      return {
        videoId: videoInfo.id,
        title: videoInfo.title,
        channel: videoInfo.channel,
        startTime,
        endTime,
        duration: endSec - startSec,
        quality: quality as YouTubeQuality,
        localPath,
        driveFileId: uploadResult.fileId,
        driveUrl: uploadResult.webViewLink,
        folder: uploadResult.folder,
      };
    } finally {
      // Always cleanup temp file
      if (localPath) {
        console.log('\nCleaning up temp file...');
        youtubeService.cleanupTempFile(localPath);
      }
    }
  }

  /**
   * Import multiple clips from the same video
   */
  async importBatchClips(
    request: YouTubeBatchClipRequest
  ): Promise<{ success: YouTubeClipResult[]; failed: Array<{ clip: any; error: string }> }> {
    const { videoUrl, clips, quality = '1080' } = request;
    const success: YouTubeClipResult[] = [];
    const failed: Array<{ clip: any; error: string }> = [];

    console.log(`\n=== Batch Import: ${clips.length} clips ===`);

    // Get video info once
    const videoInfo = await youtubeService.getVideoInfo(videoUrl);
    console.log(`Video: ${videoInfo.title}`);

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      console.log(`\n--- Clip ${i + 1}/${clips.length} ---`);

      try {
        const result = await this.importClip({
          videoUrl,
          startTime: clip.startTime,
          endTime: clip.endTime,
          quality,
          outputName: clip.name,
        });
        success.push(result);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failed.push({ clip, error: errorMessage });
        console.error(`Failed to import clip ${i + 1}:`, errorMessage);
      }
    }

    console.log(`\n=== Batch Complete ===`);
    console.log(`Success: ${success.length}/${clips.length}`);
    console.log(`Failed: ${failed.length}/${clips.length}`);

    return { success, failed };
  }

  /**
   * Import a specific chapter from a video
   */
  async importChapter(
    videoUrl: string,
    chapterName: string,
    quality: YouTubeQuality = '1080'
  ): Promise<YouTubeClipResult> {
    let localPath: string | undefined;

    try {
      console.log('\n=== Starting Chapter Import ===');
      console.log(`Chapter: "${chapterName}"`);

      // Get video info
      const videoInfo = await youtubeService.getVideoInfo(videoUrl);
      
      // Find chapter info
      const chapter = videoInfo.chapters?.find(
        ch => ch.title.toLowerCase().includes(chapterName.toLowerCase())
      );

      // Download chapter
      localPath = await youtubeService.downloadChapter(videoUrl, chapterName, quality);

      // Upload to Drive
      const driveService = getDriveService();
      const uploadResult = await driveService.uploadClip(
        localPath,
        `${videoInfo.title} - ${chapterName}`,
        videoInfo.channel.replace(/[^a-zA-Z0-9]/g, ''),
        new Date()
      );

      return {
        videoId: videoInfo.id,
        title: `${videoInfo.title} - ${chapterName}`,
        channel: videoInfo.channel,
        startTime: chapter ? youtubeService.formatTimestamp(chapter.startTime) : '0:00',
        endTime: chapter ? youtubeService.formatTimestamp(chapter.endTime) : 'unknown',
        duration: chapter ? chapter.endTime - chapter.startTime : 0,
        quality,
        localPath,
        driveFileId: uploadResult.fileId,
        driveUrl: uploadResult.webViewLink,
        folder: uploadResult.folder,
      };
    } finally {
      if (localPath) {
        youtubeService.cleanupTempFile(localPath);
      }
    }
  }

  /**
   * Preview video info without downloading
   */
  async previewVideo(videoUrl: string): Promise<YouTubeVideoInfo> {
    return youtubeService.getVideoInfo(videoUrl);
  }

  /**
   * Get video transcript for finding clip moments
   */
  async getTranscript(videoUrl: string): Promise<string | null> {
    return youtubeService.getTranscript(videoUrl);
  }

  /**
   * List video chapters for easy clipping
   */
  async listChapters(videoUrl: string): Promise<{ title: string; startTime: string; duration: number }[]> {
    const videoInfo = await youtubeService.getVideoInfo(videoUrl);
    
    if (!videoInfo.chapters || videoInfo.chapters.length === 0) {
      return [];
    }

    return videoInfo.chapters.map(ch => ({
      title: ch.title,
      startTime: youtubeService.formatTimestamp(ch.startTime),
      duration: ch.endTime - ch.startTime,
    }));
  }
}

// Export singleton instance
export const youtubeWorkflowService = new YouTubeWorkflowService();
