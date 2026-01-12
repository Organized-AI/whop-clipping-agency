import { youtubeService } from './youtube-service';
import { getDriveService } from './drive-service';
import {
  ExtractClipsRequest,
  ExtractClipsResponse,
  ExtractedClip
} from '../types/highlights';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * VOD Multi-Clip Service
 * Downloads once, splits many - efficient clip extraction
 */
export class VodService {

  /**
   * Extract multiple clips from a VOD using download-once approach
   */
  async extractClips(request: ExtractClipsRequest): Promise<ExtractClipsResponse> {
    const { vodUrl, clips, quality = '1080', parallelUploads = true } = request;

    const startTime = Date.now();
    console.log('\n=== VOD Multi-Clip Extraction ===');
    console.log(`URL: ${vodUrl}`);
    console.log(`Clips to extract: ${clips.length}`);
    console.log(`Quality: ${quality}p`);

    // Get video info
    const videoInfo = await youtubeService.getVideoInfo(vodUrl);
    console.log(`\nVideo: ${videoInfo.title}`);

    // Calculate range to download
    const timestamps = clips.map(c => ({
      start: youtubeService.parseTimestamp(c.startTime),
      end: youtubeService.parseTimestamp(c.endTime),
    }));

    const minStart = Math.max(0, Math.min(...timestamps.map(t => t.start)) - 5);
    const maxEnd = Math.max(...timestamps.map(t => t.end)) + 5;

    console.log(`\nDownload range: ${this.formatTime(minStart)} - ${this.formatTime(maxEnd)}`);

    const sessionId = uuidv4().slice(0, 8);
    const tempDir = `/tmp/vod-${sessionId}`;
    fs.mkdirSync(tempDir, { recursive: true });

    const results: ExtractedClip[] = [];
    const errors: Array<{ clip: string; error: string }> = [];

    let vodPath: string | undefined;

    try {
      // Step 1: Download the VOD segment
      console.log('\n[1/3] Downloading VOD segment...');
      vodPath = await this.downloadVodSegment(
        vodUrl,
        minStart,
        maxEnd,
        quality,
        tempDir
      );
      console.log(`Downloaded: ${this.getFileSize(vodPath)} MB`);

      // Step 2: Split into individual clips
      console.log('\n[2/3] Splitting into clips...');
      const clipPaths: Array<{ path: string; name: string; clip: typeof clips[0] }> = [];

      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const clipName = clip.name || `clip-${i + 1}`;
        const outputPath = path.join(tempDir, `${clipName}.mp4`);

        try {
          console.log(`  Extracting: ${clipName} (${clip.startTime} - ${clip.endTime})`);

          // Calculate relative timestamps
          const relativeStart = youtubeService.parseTimestamp(clip.startTime) - minStart + 5;
          const duration = youtubeService.parseTimestamp(clip.endTime) -
            youtubeService.parseTimestamp(clip.startTime);

          // FFmpeg with stream copy (instant, no re-encode)
          execSync(`ffmpeg -y -ss ${relativeStart} -i "${vodPath}" -t ${duration} -c copy -avoid_negative_ts make_zero "${outputPath}"`, { stdio: 'pipe' });

          clipPaths.push({ path: outputPath, name: clipName, clip });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`  Failed: ${clipName} - ${errorMessage}`);
          errors.push({ clip: clipName, error: errorMessage });
        }
      }

      console.log(`Extracted ${clipPaths.length}/${clips.length} clips`);

      // Step 3: Upload to Drive
      console.log('\n[3/3] Uploading to Google Drive...');
      const driveService = getDriveService();

      if (parallelUploads) {
        // Parallel upload (faster for many clips)
        const uploadPromises = clipPaths.map(async ({ path: clipPath, name, clip }) => {
          try {
            const uploadResult = await driveService.uploadClip(
              clipPath,
              name,
              videoInfo.channel,
              new Date()
            );

            return {
              name,
              startTime: clip.startTime,
              endTime: clip.endTime,
              duration: youtubeService.parseTimestamp(clip.endTime) -
                youtubeService.parseTimestamp(clip.startTime),
              driveFileId: uploadResult.fileId,
              driveUrl: uploadResult.webViewLink,
              folder: uploadResult.folder,
            };
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push({ clip: name, error: errorMessage });
            return null;
          }
        });

        const uploadResults = await Promise.all(uploadPromises);
        results.push(...uploadResults.filter((r): r is ExtractedClip => r !== null));
      } else {
        // Sequential upload
        for (const { path: clipPath, name, clip } of clipPaths) {
          try {
            console.log(`  Uploading: ${name}`);
            const uploadResult = await driveService.uploadClip(
              clipPath,
              name,
              videoInfo.channel,
              new Date()
            );

            results.push({
              name,
              startTime: clip.startTime,
              endTime: clip.endTime,
              duration: youtubeService.parseTimestamp(clip.endTime) -
                youtubeService.parseTimestamp(clip.startTime),
              driveFileId: uploadResult.fileId,
              driveUrl: uploadResult.webViewLink,
              folder: uploadResult.folder,
            });
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push({ clip: name, error: errorMessage });
          }
        }
      }

    } finally {
      // Cleanup temp directory
      console.log('\nCleaning up temp files...');
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    const processingTime = (Date.now() - startTime) / 1000;

    console.log('\n=== Extraction Complete ===');
    console.log(`Successful: ${results.length}/${clips.length}`);
    console.log(`Processing time: ${processingTime.toFixed(1)}s`);

    return {
      vodId: videoInfo.id,
      vodTitle: videoInfo.title,
      totalClips: clips.length,
      successful: results.length,
      failed: errors.length,
      clips: results,
      errors: errors.length > 0 ? errors : undefined,
      processingTime,
    };
  }

  /**
   * Download a specific segment of a VOD
   */
  private async downloadVodSegment(
    vodUrl: string,
    startTime: number,
    endTime: number,
    quality: string,
    outputDir: string
  ): Promise<string> {
    const outputPath = path.join(outputDir, 'vod-segment.mp4');

    // Use yt-dlp with download-sections
    const command = `yt-dlp "${vodUrl}" --download-sections "*${this.formatTime(startTime)}-${this.formatTime(endTime)}" -f "bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]" --merge-output-format mp4 -o "${outputPath}"`;

    execSync(command, { stdio: 'pipe', timeout: 600000 }); // 10 min timeout

    return outputPath;
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  private getFileSize(filePath: string): string {
    const stats = fs.statSync(filePath);
    return (stats.size / (1024 * 1024)).toFixed(1);
  }
}

export const vodService = new VodService();
