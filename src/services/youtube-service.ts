import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { clipsConfig } from '../config/clips-config';
import {
  YouTubeVideoInfo,
  YouTubeClipRequest,
  YouTubeClipResult,
  YouTubeQuality,
  YouTubeChapter,
  ScrapCreatorsYouTubeResponse,
} from '../types/youtube';

const execAsync = promisify(exec);

// Timeout for API calls
const API_TIMEOUT_MS = 30000;

export class YouTubeService {
  private tempPath: string;
  private ytdlpPath: string;
  private ffmpegPath: string;
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.tempPath = clipsConfig.clips.tempDownloadPath;
    this.ytdlpPath = 'yt-dlp'; // Uses PATH
    this.ffmpegPath = 'ffmpeg'; // Uses PATH
    this.apiKey = clipsConfig.scrapcreators.apiKey;
    this.apiUrl = clipsConfig.scrapcreators.apiUrl;

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempPath)) {
      fs.mkdirSync(this.tempPath, { recursive: true });
    }
  }

  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url: string): string {
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    throw new Error(`Could not extract video ID from URL: ${url}`);
  }

  /**
   * Convert timestamp string to seconds
   * Supports: "1:23:45", "23:45", "45", "1:23"
   */
  parseTimestamp(timestamp: string): number {
    // If it's just a number, return it as seconds
    if (/^\d+$/.test(timestamp)) {
      return parseInt(timestamp, 10);
    }

    const parts = timestamp.split(':').map(Number);
    
    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    }
    
    throw new Error(`Invalid timestamp format: ${timestamp}`);
  }

  /**
   * Convert seconds to timestamp string (HH:MM:SS or MM:SS)
   */
  formatTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * Format seconds to ffmpeg-compatible timestamp (HH:MM:SS)
   */
  private formatFFmpegTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * Get video metadata using yt-dlp
   */
  async getVideoInfo(videoUrl: string): Promise<YouTubeVideoInfo> {
    const videoId = this.extractVideoId(videoUrl);
    
    try {
      const { stdout } = await execAsync(
        `${this.ytdlpPath} --dump-json --no-download "${videoUrl}"`,
        { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for large metadata
      );

      const data = JSON.parse(stdout);

      // Parse chapters if available
      const chapters: YouTubeChapter[] = (data.chapters || []).map((ch: any) => ({
        title: ch.title,
        startTime: ch.start_time,
        endTime: ch.end_time,
      }));

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        duration: data.duration,
        durationString: this.formatTimestamp(data.duration),
        channel: data.channel || data.uploader,
        channelId: data.channel_id || data.uploader_id,
        uploadDate: data.upload_date,
        viewCount: data.view_count || 0,
        likeCount: data.like_count,
        thumbnail: data.thumbnail,
        categories: data.categories,
        tags: data.tags,
        chapters,
      };
    } catch (error: any) {
      throw new Error(`Failed to get video info: ${error.message}`);
    }
  }

  /**
   * Get video transcript via ScrapCreators API
   */
  async getTranscript(videoUrl: string): Promise<string | null> {
    const videoId = this.extractVideoId(videoUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${this.apiUrl}/youtube/video?videoId=${videoId}`,
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        console.warn(`ScrapCreators API returned ${response.status}`);
        return null;
      }

      const data = await response.json() as ScrapCreatorsYouTubeResponse;
      return data.transcript_only_text || data.transcript || null;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`Transcript API timeout after ${API_TIMEOUT_MS / 1000}s`);
      } else {
        console.warn('Failed to fetch transcript:', error);
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Build yt-dlp format string for quality
   */
  private buildFormatString(quality: YouTubeQuality): string {
    const height = parseInt(quality, 10);
    return `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`;
  }

  /**
   * Download a specific clip from YouTube video using timestamps
   * Uses two-step approach: download full video portion, then trim with ffmpeg
   */
  async downloadClip(request: YouTubeClipRequest): Promise<string> {
    const { videoUrl, startTime, endTime, quality = '1080', outputName } = request;
    
    const videoId = this.extractVideoId(videoUrl);
    const startSec = this.parseTimestamp(startTime);
    const endSec = this.parseTimestamp(endTime);
    
    if (endSec <= startSec) {
      throw new Error('End time must be after start time');
    }

    const duration = endSec - startSec;
    if (duration > 600) { // 10 minutes max
      throw new Error('Clip duration cannot exceed 10 minutes');
    }

    // Generate output filename
    const sanitizedName = outputName 
      ? outputName.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 50)
      : `clip-${startTime.replace(/:/g, '')}-${endTime.replace(/:/g, '')}`;
    const filename = `${videoId}-${sanitizedName}-${uuidv4().slice(0, 8)}.mp4`;
    const outputPath = path.join(this.tempPath, filename);
    const tempFullPath = path.join(this.tempPath, `${videoId}-temp-${uuidv4().slice(0, 8)}.mp4`);

    console.log(`\n📹 Downloading YouTube clip...`);
    console.log(`Video: ${videoUrl}`);
    console.log(`Range: ${startTime} → ${endTime} (${duration}s)`);
    console.log(`Quality: ${quality}p`);

    const formatString = this.buildFormatString(quality);
    
    try {
      // Method 1: Try direct --download-sections first (faster when it works)
      const directCommand = [
        this.ytdlpPath,
        `"${videoUrl}"`,
        `--download-sections "*${startTime}-${endTime}"`,
        `-f "${formatString}"`,
        '--merge-output-format mp4',
        '--no-playlist',
        '--quiet',
        '--no-warnings',
        '-o', `"${outputPath}"`,
      ].join(' ');

      console.log(`Trying direct download...`);
      
      try {
        await execAsync(directCommand, {
          maxBuffer: 50 * 1024 * 1024,
          timeout: 120000,
        });

        // Check if file was created
        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          if (stats.size > 1000) { // More than 1KB
            console.log(`✅ Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            return outputPath;
          }
        }
      } catch (directError) {
        console.log(`Direct download failed, using two-step method...`);
      }

      // Method 2: Two-step approach - download then cut
      // Step 1: Download the video (or a portion around the clip)
      const downloadStart = Math.max(0, startSec - 5);
      const downloadEnd = endSec + 5;
      
      const downloadCommand = [
        this.ytdlpPath,
        `"${videoUrl}"`,
        `-f "${formatString}"`,
        '--merge-output-format mp4',
        '--no-playlist',
        '--quiet',
        '-o', `"${tempFullPath}"`,
      ].join(' ');

      console.log(`Step 1/2: Downloading video segment...`);
      
      await execAsync(downloadCommand, {
        maxBuffer: 500 * 1024 * 1024,
        timeout: 300000,
      });

      // Find the actual downloaded file (yt-dlp may modify filename)
      let actualTempPath = tempFullPath;
      if (!fs.existsSync(tempFullPath)) {
        const files = fs.readdirSync(this.tempPath)
          .filter(f => f.includes(videoId) && f.includes('temp') && f.endsWith('.mp4'));
        if (files.length > 0) {
          actualTempPath = path.join(this.tempPath, files[files.length - 1]);
        } else {
          throw new Error('Download completed but temp file not found');
        }
      }

      // Step 2: Cut with ffmpeg
      console.log(`Step 2/2: Trimming with ffmpeg...`);
      
      const ffmpegStart = this.formatFFmpegTimestamp(startSec);
      const ffmpegDuration = duration;
      
      const ffmpegCommand = [
        this.ffmpegPath,
        '-y', // Overwrite output
        '-ss', ffmpegStart, // Seek to start (before -i for faster seeking)
        '-i', `"${actualTempPath}"`,
        '-t', ffmpegDuration.toString(), // Duration
        '-c', 'copy', // Copy streams without re-encoding (fast)
        '-avoid_negative_ts', 'make_zero',
        `"${outputPath}"`,
      ].join(' ');

      await execAsync(ffmpegCommand, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 60000,
      });

      // Cleanup temp file
      if (fs.existsSync(actualTempPath)) {
        fs.unlinkSync(actualTempPath);
      }

      // Verify output
      if (!fs.existsSync(outputPath)) {
        throw new Error('FFmpeg completed but output file not found');
      }

      const stats = fs.statSync(outputPath);
      console.log(`✅ Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      return outputPath;
    } catch (error: any) {
      // Cleanup on error
      if (fs.existsSync(tempFullPath)) {
        fs.unlinkSync(tempFullPath);
      }
      throw new Error(`Failed to download clip: ${error.message}`);
    }
  }

  /**
   * Download full video
   */
  async downloadVideo(
    videoUrl: string,
    quality: YouTubeQuality = '1080',
    audioOnly: boolean = false
  ): Promise<string> {
    const videoId = this.extractVideoId(videoUrl);
    const filename = `${videoId}-full-${uuidv4().slice(0, 8)}.${audioOnly ? 'mp3' : 'mp4'}`;
    const outputPath = path.join(this.tempPath, filename);

    console.log(`\n📹 Downloading full YouTube video...`);
    console.log(`Video: ${videoUrl}`);
    console.log(`Quality: ${quality}p`);

    let formatString: string;
    if (audioOnly) {
      formatString = 'bestaudio';
    } else {
      formatString = this.buildFormatString(quality);
    }

    const command = [
      this.ytdlpPath,
      `"${videoUrl}"`,
      `-f "${formatString}"`,
      audioOnly ? '-x --audio-format mp3' : '--merge-output-format mp4',
      '--no-playlist',
      '--no-warnings',
      '-o', `"${outputPath}"`,
    ].join(' ');

    try {
      await execAsync(command, {
        maxBuffer: 500 * 1024 * 1024, // 500MB buffer for full videos
        timeout: 1800000, // 30 minute timeout
      });

      if (!fs.existsSync(outputPath)) {
        const files = fs.readdirSync(this.tempPath)
          .filter(f => f.startsWith(videoId));
        if (files.length > 0) {
          return path.join(this.tempPath, files[files.length - 1]);
        }
        throw new Error('Download completed but file not found');
      }

      const stats = fs.statSync(outputPath);
      console.log(`✅ Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      return outputPath;
    } catch (error: any) {
      throw new Error(`Failed to download video: ${error.message}`);
    }
  }

  /**
   * Download a specific chapter from a video
   */
  async downloadChapter(
    videoUrl: string,
    chapterName: string,
    quality: YouTubeQuality = '1080'
  ): Promise<string> {
    const videoId = this.extractVideoId(videoUrl);
    const sanitizedChapter = chapterName.replace(/[^a-zA-Z0-9-_\s]/g, '').slice(0, 50);
    const filename = `${videoId}-${sanitizedChapter}-${uuidv4().slice(0, 8)}.mp4`;
    const outputPath = path.join(this.tempPath, filename);

    console.log(`\n📹 Downloading YouTube chapter...`);
    console.log(`Chapter: "${chapterName}"`);

    const formatString = this.buildFormatString(quality);

    const command = [
      this.ytdlpPath,
      `"${videoUrl}"`,
      `--download-sections "${chapterName}"`,
      `-f "${formatString}"`,
      '--merge-output-format mp4',
      '--no-playlist',
      '-o', `"${outputPath}"`,
    ].join(' ');

    try {
      await execAsync(command, {
        maxBuffer: 100 * 1024 * 1024,
        timeout: 600000,
      });

      // Find the downloaded file
      const files = fs.readdirSync(this.tempPath)
        .filter(f => f.includes(videoId) && f.endsWith('.mp4'));
      
      if (files.length === 0) {
        throw new Error('Chapter download completed but file not found');
      }

      const actualPath = path.join(this.tempPath, files[files.length - 1]);
      const stats = fs.statSync(actualPath);
      console.log(`✅ Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      return actualPath;
    } catch (error: any) {
      throw new Error(`Failed to download chapter: ${error.message}`);
    }
  }

  /**
   * List available video qualities
   */
  async getAvailableQualities(videoUrl: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(
        `${this.ytdlpPath} -F "${videoUrl}"`,
        { maxBuffer: 5 * 1024 * 1024 }
      );

      const qualities = new Set<string>();
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        const heightMatch = line.match(/(\d{3,4})p/);
        if (heightMatch) {
          qualities.add(heightMatch[1]);
        }
      }

      return Array.from(qualities).sort((a, b) => parseInt(b) - parseInt(a));
    } catch (error: any) {
      throw new Error(`Failed to get qualities: ${error.message}`);
    }
  }

  /**
   * Clean up temp file
   */
  cleanupTempFile(filepath: string): void {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`🧹 Cleaned up: ${filepath}`);
    }
  }

  /**
   * Clean up all temp files for a video ID
   */
  cleanupVideoFiles(videoId: string): void {
    const files = fs.readdirSync(this.tempPath)
      .filter(f => f.startsWith(videoId));
    
    for (const file of files) {
      const filepath = path.join(this.tempPath, file);
      fs.unlinkSync(filepath);
      console.log(`🧹 Cleaned up: ${filepath}`);
    }
  }
}

// Export singleton instance
export const youtubeService = new YouTubeService();
