import { execSync } from 'child_process';
import { MotionSegment, ScoredMoment } from '../../types/highlights';
import { MOTION_CONFIG } from '../../config/teaching-patterns';

/**
 * Analyzes video for screen motion/activity patterns
 * Detects terminal output, code scrolling, builds, etc.
 */
export class MotionAnalyzer {

  /**
   * Analyze video for high-activity moments
   */
  async analyze(videoPath: string): Promise<ScoredMoment[]> {
    console.log('[Motion] Analyzing screen activity...');

    // Get scene change timestamps
    const sceneChanges = await this.detectSceneChanges(videoPath);
    console.log(`[Motion] Detected ${sceneChanges.length} scene changes`);

    // Calculate motion density per window
    const segments = this.calculateMotionDensity(sceneChanges);

    // Find high-activity moments
    const highActivity = segments.filter(
      s => s.activityLevel === 'high' || s.activityLevel === 'medium'
    );

    // Convert to scored moments
    const moments = this.convertToMoments(highActivity);

    console.log(`[Motion] Found ${moments.length} active coding moments`);
    return moments;
  }

  /**
   * Use FFmpeg scene detection to find visual changes
   */
  private async detectSceneChanges(videoPath: string): Promise<number[]> {
    const threshold = MOTION_CONFIG.sceneChangeThreshold;

    try {
      // FFmpeg scene detection filter
      const command = `ffmpeg -i "${videoPath}" -vf "select='gt(scene,${threshold})',showinfo" -f null - 2>&1`;

      const output = execSync(command, {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for long videos
        timeout: 300000 // 5 min timeout
      });

      // Parse timestamps from showinfo output
      return this.parseShowinfoOutput(output);
    } catch (error: unknown) {
      // FFmpeg often returns non-zero even on success
      if (error && typeof error === 'object' && 'stdout' in error) {
        return this.parseShowinfoOutput(String((error as { stdout: unknown }).stdout || ''));
      }

      console.error('[Motion] Scene detection failed:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Parse FFmpeg showinfo output for timestamps
   */
  private parseShowinfoOutput(output: string): number[] {
    const timestamps: number[] = [];
    const regex = /pts_time:([0-9.]+)/g;

    let match;
    while ((match = regex.exec(output)) !== null) {
      timestamps.push(parseFloat(match[1]));
    }

    return timestamps;
  }

  /**
   * Calculate motion density in time windows
   */
  private calculateMotionDensity(sceneChanges: number[]): MotionSegment[] {
    if (sceneChanges.length === 0) return [];

    const maxTime = Math.max(...sceneChanges);
    const windowSize = MOTION_CONFIG.windowSize;
    const segments: MotionSegment[] = [];

    // Use overlapping windows (50% overlap)
    for (let start = 0; start < maxTime; start += windowSize / 2) {
      const end = start + windowSize;

      // Count changes in this window
      const changesInWindow = sceneChanges.filter(
        t => t >= start && t < end
      );

      const density = changesInWindow.length / windowSize;

      // Classify activity level
      let activityLevel: 'high' | 'medium' | 'low';
      if (density >= MOTION_CONFIG.highActivityDensity) {
        activityLevel = 'high';
      } else if (density >= MOTION_CONFIG.mediumActivityDensity) {
        activityLevel = 'medium';
      } else {
        activityLevel = 'low';
      }

      segments.push({
        startTime: start,
        endTime: end,
        motionScore: density * 100,
        activityLevel,
        sceneChanges: changesInWindow.length,
      });
    }

    return segments;
  }

  /**
   * Convert motion segments to scored moments
   */
  private convertToMoments(segments: MotionSegment[]): ScoredMoment[] {
    // Cluster adjacent high-activity segments
    const clusters: ScoredMoment[] = [];
    let current: ScoredMoment | null = null;

    for (const seg of segments) {
      if (seg.activityLevel === 'low') {
        // End current cluster
        if (current) {
          clusters.push(current);
          current = null;
        }
        continue;
      }

      const score = seg.activityLevel === 'high' ? 8 : 4;
      const reason = seg.activityLevel === 'high'
        ? `High activity: ${seg.sceneChanges} changes/window`
        : `Medium activity: ${seg.sceneChanges} changes/window`;

      if (current && seg.startTime <= current.endTime + 5) {
        // Extend current cluster
        current.endTime = seg.endTime;
        current.score = Math.max(current.score, score);
      } else {
        // Start new cluster
        if (current) clusters.push(current);
        current = {
          startTime: seg.startTime,
          endTime: seg.endTime,
          score,
          reason,
          source: 'motion',
        };
      }
    }

    if (current) clusters.push(current);

    // Filter out very short activity bursts
    return clusters.filter(
      c => (c.endTime - c.startTime) >= MOTION_CONFIG.minActivityDuration
    );
  }
}

export const motionAnalyzer = new MotionAnalyzer();
