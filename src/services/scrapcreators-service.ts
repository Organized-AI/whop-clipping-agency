import { clipsConfig } from '../config/clips-config';
import {
  ScrapCreatorsResponse,
  ScrapCreatorsResponseSchema,
  ProcessedClip,
  VideoQuality
} from '../types/clips';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ScrapCreatorsService {
  private apiKey: string;
  private apiUrl: string;
  private tempPath: string;

  constructor() {
    this.apiKey = clipsConfig.scrapcreators.apiKey;
    this.apiUrl = clipsConfig.scrapcreators.apiUrl;
    this.tempPath = clipsConfig.clips.tempDownloadPath;

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempPath)) {
      fs.mkdirSync(this.tempPath, { recursive: true });
    }
  }

  /**
   * Extract clip slug from Twitch URL
   */
  extractSlug(clipUrl: string): string {
    // Handle various Twitch clip URL formats:
    // https://clips.twitch.tv/SlugName
    // https://www.twitch.tv/channel/clip/SlugName
    // https://clips.twitch.tv/create/SlugName

    const patterns = [
      /clips\.twitch\.tv\/create\/([A-Za-z0-9_-]+)/,
      /clips\.twitch\.tv\/([A-Za-z0-9_-]+)/,
      /twitch\.tv\/\w+\/clip\/([A-Za-z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = clipUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    throw new Error(`Could not extract clip slug from URL: ${clipUrl}`);
  }

  /**
   * Fetch clip data from ScrapCreators API
   */
  async fetchClipData(clipUrl: string): Promise<ScrapCreatorsResponse> {
    // API requires the full URL, not just the slug
    const encodedUrl = encodeURIComponent(clipUrl);

    const response = await fetch(`${this.apiUrl}/twitch/clip?url=${encodedUrl}`, {
      method: 'GET',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ScrapCreators API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response
    const parsed = ScrapCreatorsResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('API Response validation failed:', parsed.error);
      throw new Error('Invalid API response format');
    }

    return parsed.data;
  }

  /**
   * Find the best video URL for requested quality
   */
  findVideoUrl(response: ScrapCreatorsResponse, quality: VideoQuality): string {
    const clip = response['0'].data.clip;

    // First check if videoURL is directly available with auth token
    if (clip.videoURL) {
      return clip.videoURL;
    }

    // Check assets for SOURCE type with matching quality
    if (clip.assets && clip.assets.length > 0) {
      const sourceAsset = clip.assets.find(a => a.type === 'SOURCE');
      if (sourceAsset && sourceAsset.videoQualities) {
        const qualityMatch = sourceAsset.videoQualities.find(
          vq => vq.quality === quality
        );
        if (qualityMatch) {
          return qualityMatch.sourceURL;
        }
        // Fallback to highest quality available
        return sourceAsset.videoQualities[0]?.sourceURL || '';
      }
    }

    // Check videoQualities array directly
    if (clip.videoQualities && clip.videoQualities.length > 0) {
      const qualityMatch = clip.videoQualities.find(
        vq => vq.quality === quality
      );
      if (qualityMatch) {
        return qualityMatch.sourceURL;
      }
      // Fallback to first available
      return clip.videoQualities[0]?.sourceURL || '';
    }

    throw new Error('No video URL found in API response');
  }

  /**
   * Process API response into clean clip data
   */
  processClipData(response: ScrapCreatorsResponse, quality: VideoQuality): ProcessedClip {
    const clip = response['0'].data.clip;
    const videoUrl = this.findVideoUrl(response, quality);

    return {
      id: clip.id,
      slug: clip.slug,
      title: clip.title,
      duration: clip.durationSeconds,
      broadcaster: clip.broadcaster.displayName,
      broadcasterLogin: clip.broadcaster.login,
      game: clip.game?.name || null,
      thumbnailUrl: clip.thumbnailURL,
      videoUrl,
      quality,
      createdAt: new Date(clip.createdAt),
    };
  }

  /**
   * Download video file to temp directory
   */
  async downloadVideo(processedClip: ProcessedClip): Promise<string> {
    const filename = `${processedClip.slug}-${processedClip.quality}p-${uuidv4().slice(0, 8)}.mp4`;
    const filepath = path.join(this.tempPath, filename);

    console.log(`Downloading clip: ${processedClip.title}`);
    console.log(`From: ${processedClip.videoUrl}`);
    console.log(`To: ${filepath}`);

    const response = await fetch(processedClip.videoUrl);

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));

    const stats = fs.statSync(filepath);
    console.log(`Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    return filepath;
  }

  /**
   * Clean up temp file
   */
  cleanupTempFile(filepath: string): void {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`Cleaned up: ${filepath}`);
    }
  }

  /**
   * Get remaining API credits
   */
  async getCreditsRemaining(response: ScrapCreatorsResponse): Promise<number | null> {
    return response.credits_remaining ?? null;
  }
}

// Export singleton instance
export const scrapCreatorsService = new ScrapCreatorsService();
