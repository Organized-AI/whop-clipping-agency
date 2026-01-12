import {
  ScoredMoment,
  DetectedHighlight,
  DevStreamClipType
} from '../../types/highlights';
import {
  FUSION_WEIGHTS,
  CLIP_TYPE_THRESHOLDS
} from '../../config/teaching-patterns';

/**
 * Combines signals from multiple analyzers into ranked highlights
 */
export class SignalFusion {

  /**
   * Fuse transcript and motion signals into final highlights
   */
  fuse(
    transcriptMoments: ScoredMoment[],
    motionMoments: ScoredMoment[],
    audioMoments: ScoredMoment[] = []
  ): DetectedHighlight[] {
    console.log('[Fusion] Combining signals...');
    console.log(`  Transcript moments: ${transcriptMoments.length}`);
    console.log(`  Motion moments: ${motionMoments.length}`);
    console.log(`  Audio moments: ${audioMoments.length}`);

    // Create time buckets (10 second windows)
    const buckets = new Map<number, {
      startTime: number;
      signals: { transcript: number; motion: number; audio: number };
      reasons: string[];
    }>();

    // Add transcript signals
    for (const m of transcriptMoments) {
      const bucket = Math.floor(m.startTime / 10) * 10;
      const existing = buckets.get(bucket) || this.createBucket(bucket);
      existing.signals.transcript += m.score;
      existing.reasons.push(m.reason);
      buckets.set(bucket, existing);
    }

    // Add motion signals
    for (const m of motionMoments) {
      const bucket = Math.floor(m.startTime / 10) * 10;
      const existing = buckets.get(bucket) || this.createBucket(bucket);
      existing.signals.motion += m.score;
      existing.reasons.push(m.reason);
      buckets.set(bucket, existing);
    }

    // Add audio signals
    for (const m of audioMoments) {
      const bucket = Math.floor(m.startTime / 10) * 10;
      const existing = buckets.get(bucket) || this.createBucket(bucket);
      existing.signals.audio += m.score;
      existing.reasons.push(m.reason);
      buckets.set(bucket, existing);
    }

    // Calculate total scores and classify
    const highlights: DetectedHighlight[] = [];

    for (const [startTime, bucket] of buckets) {
      const totalScore = this.calculateTotalScore(bucket.signals);

      // Skip low-scoring buckets
      if (totalScore < 3) continue;

      const clipType = this.classifyClipType(bucket.signals, bucket.reasons);
      const confidence = this.calculateConfidence(bucket.signals, totalScore);

      highlights.push({
        startTime: bucket.startTime,
        endTime: bucket.startTime + 15, // Will be refined by clustering
        duration: 15,
        totalScore,
        signals: bucket.signals,
        clipType,
        reason: [...new Set(bucket.reasons)].join('; '),
        confidence,
      });
    }

    // Cluster adjacent highlights
    const clustered = this.clusterHighlights(highlights);

    // Sort by score descending
    clustered.sort((a, b) => b.totalScore - a.totalScore);

    console.log(`[Fusion] Produced ${clustered.length} combined highlights`);
    return clustered;
  }

  private createBucket(startTime: number) {
    return {
      startTime,
      signals: { transcript: 0, motion: 0, audio: 0 },
      reasons: [] as string[],
    };
  }

  private calculateTotalScore(signals: {
    transcript: number;
    motion: number;
    audio: number
  }): number {
    return (
      signals.transcript * FUSION_WEIGHTS.transcript +
      signals.motion * FUSION_WEIGHTS.motion +
      signals.audio * FUSION_WEIGHTS.audio
    );
  }

  private classifyClipType(
    signals: { transcript: number; motion: number; audio: number },
    reasons: string[]
  ): DevStreamClipType {
    const { transcript, motion } = signals;

    // Check for realization moments first (highest priority)
    if (reasons.some(r => r.includes('Realization'))) {
      return 'aha_moment';
    }

    // High explanation, low motion = pure teaching
    if (transcript >= CLIP_TYPE_THRESHOLDS.explanation.transcript &&
      motion < CLIP_TYPE_THRESHOLDS.explanation.motion) {
      return 'explanation';
    }

    // High motion, low explanation = build/terminal
    if (motion >= CLIP_TYPE_THRESHOLDS.buildMoment.motion &&
      transcript < CLIP_TYPE_THRESHOLDS.buildMoment.transcript) {
      return 'build_moment';
    }

    // Both present = demo (explaining while doing)
    if (transcript >= CLIP_TYPE_THRESHOLDS.demo.transcript &&
      motion >= CLIP_TYPE_THRESHOLDS.demo.motion) {
      return 'demo';
    }

    // Default to explanation
    return 'explanation';
  }

  private calculateConfidence(
    signals: { transcript: number; motion: number; audio: number },
    totalScore: number
  ): number {
    // Confidence based on signal agreement and strength
    const signalCount = [
      signals.transcript > 0,
      signals.motion > 0,
      signals.audio > 0,
    ].filter(Boolean).length;

    // Base confidence from score (0-10 normalized)
    let confidence = Math.min(totalScore / 10, 0.8);

    // Boost for multiple signal agreement
    confidence += signalCount * 0.05;

    return Math.min(confidence, 1.0);
  }

  private clusterHighlights(highlights: DetectedHighlight[]): DetectedHighlight[] {
    if (highlights.length === 0) return [];

    // Sort by start time
    const sorted = [...highlights].sort((a, b) => a.startTime - b.startTime);

    const clustered: DetectedHighlight[] = [];
    let current = { ...sorted[0] };

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];

      // If overlapping or adjacent, merge
      if (next.startTime <= current.endTime + 5) {
        current.endTime = Math.max(current.endTime, next.endTime);
        current.totalScore += next.totalScore;
        current.signals.transcript += next.signals.transcript;
        current.signals.motion += next.signals.motion;
        current.signals.audio += next.signals.audio;
        current.reason += '; ' + next.reason;
        current.confidence = Math.max(current.confidence, next.confidence);

        // Re-classify merged clip
        current.clipType = this.classifyClipType(
          current.signals,
          current.reason.split('; ')
        );
      } else {
        // Finalize current and start new
        current.duration = current.endTime - current.startTime;
        clustered.push(current);
        current = { ...next };
      }
    }

    // Don't forget the last one
    current.duration = current.endTime - current.startTime;
    clustered.push(current);

    return clustered;
  }
}

export const signalFusion = new SignalFusion();
