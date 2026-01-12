import { youtubeService } from '../youtube-service';
import { transcriptAnalyzer } from './transcript-analyzer';
import { motionAnalyzer } from './motion-analyzer';
import { signalFusion } from './signal-fusion';
import {
  DetectedHighlight,
  DetectHighlightsRequest,
  DetectHighlightsResponse,
  ScoredMoment
} from '../../types/highlights';
import * as fs from 'fs';

/**
 * Main highlight detection service for dev streams
 */
export class HighlightDetectionService {

  /**
   * Detect highlights in a dev stream VOD
   */
  async detectHighlights(
    request: DetectHighlightsRequest
  ): Promise<DetectHighlightsResponse> {
    const { vodUrl, options = {} } = request;
    const {
      maxClips = 10,
      minScore = 3,
      preferTypes,
      analysisQuality = '720',
      skipMotionAnalysis = false,
    } = options;

    const startTime = Date.now();
    console.log('\n=== Dev Stream Highlight Detection ===');
    console.log(`URL: ${vodUrl}`);
    console.log(`Max clips: ${maxClips}, Min score: ${minScore}`);

    // Get video info
    const videoInfo = await youtubeService.getVideoInfo(vodUrl);
    console.log(`\nVideo: ${videoInfo.title}`);
    console.log(`Duration: ${this.formatDuration(videoInfo.duration)}`);

    // Run analyzers
    let videoPath: string | undefined;

    try {
      // 1. Transcript analysis (doesn't need download)
      console.log('\n[1/3] Running transcript analysis...');
      const transcriptMoments = await transcriptAnalyzer.analyze(vodUrl);

      // 2. Motion analysis (needs video download)
      let motionMoments: ScoredMoment[] = [];
      if (!skipMotionAnalysis) {
        console.log('\n[2/3] Downloading for motion analysis...');
        videoPath = await youtubeService.downloadVideo(
          vodUrl,
          analysisQuality as '720' | '480' | '1080' | '1440' | '2160' | '360',
          false
        );

        console.log('[2/3] Running motion analysis...');
        motionMoments = await motionAnalyzer.analyze(videoPath);
      } else {
        console.log('\n[2/3] Motion analysis skipped');
      }

      // 3. Signal fusion
      console.log('\n[3/3] Fusing signals...');
      let highlights = signalFusion.fuse(
        transcriptMoments,
        motionMoments,
        [] // Audio moments (optional, not implemented yet)
      );

      // Apply filters
      highlights = highlights.filter(h => h.totalScore >= minScore);

      if (preferTypes && preferTypes.length > 0) {
        // Boost preferred types
        highlights = highlights.map(h => ({
          ...h,
          totalScore: preferTypes.includes(h.clipType)
            ? h.totalScore * 1.5
            : h.totalScore,
        }));
        highlights.sort((a, b) => b.totalScore - a.totalScore);
      }

      // Take top N
      highlights = highlights.slice(0, maxClips);

      const analysisTime = (Date.now() - startTime) / 1000;

      console.log(`\n=== Detection Complete ===`);
      console.log(`Found ${highlights.length} highlights in ${analysisTime.toFixed(1)}s`);

      return {
        vodId: videoInfo.id,
        vodTitle: videoInfo.title,
        vodDuration: videoInfo.duration,
        analysisTime,
        highlights,
      };

    } finally {
      // Cleanup
      if (videoPath && fs.existsSync(videoPath)) {
        console.log('\nCleaning up analysis video...');
        fs.unlinkSync(videoPath);
      }
    }
  }

  /**
   * Quick detection using transcript only (faster)
   */
  async quickDetect(vodUrl: string, maxClips: number = 10): Promise<DetectedHighlight[]> {
    return (await this.detectHighlights({
      vodUrl,
      options: {
        maxClips,
        skipMotionAnalysis: true,
      },
    })).highlights;
  }

  private formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

export const highlightDetectionService = new HighlightDetectionService();

// Re-export components
export { transcriptAnalyzer } from './transcript-analyzer';
export { motionAnalyzer } from './motion-analyzer';
export { signalFusion } from './signal-fusion';
