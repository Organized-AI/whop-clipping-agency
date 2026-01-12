import { execSync } from 'child_process';
import * as fs from 'fs';
import { youtubeService } from '../youtube-service';
import {
  TranscriptSegment,
  ScoredMoment
} from '../../types/highlights';
import {
  TEACHING_PATTERNS,
  SCORE_WEIGHTS
} from '../../config/teaching-patterns';

/**
 * Analyzes video transcripts to detect teaching/explanation moments
 */
export class TranscriptAnalyzer {

  /**
   * Get and analyze transcript for teaching patterns
   */
  async analyze(videoUrl: string): Promise<ScoredMoment[]> {
    console.log('[Transcript] Fetching transcript...');

    // Try YouTube service first (uses ScrapCreators API internally)
    let transcript: string | null = null;
    try {
      transcript = await youtubeService.getTranscript(videoUrl);
    } catch (error) {
      console.log('[Transcript] ScrapCreators failed, trying yt-dlp...');
    }

    // Fallback to yt-dlp subtitles
    if (!transcript) {
      transcript = await this.getYtDlpTranscript(videoUrl);
    }

    if (!transcript) {
      console.log('[Transcript] No transcript available');
      return [];
    }

    // Parse into segments
    const segments = this.parseTranscript(transcript);
    console.log(`[Transcript] Parsed ${segments.length} segments`);

    // Score each segment
    const scored = segments.map(seg => this.scoreSegment(seg));

    // Filter and cluster high-scoring moments
    const moments = this.clusterMoments(
      scored.filter(s => s.score >= 2),
      15 // Gap threshold in seconds
    );

    console.log(`[Transcript] Found ${moments.length} teaching moments`);
    return moments;
  }

  /**
   * Parse raw transcript into timestamped segments
   */
  private parseTranscript(transcript: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];

    // Handle different transcript formats
    // Format 1: "[00:01:23] Text here"
    const timestampPattern = /\[(\d{2}:\d{2}:\d{2})\]\s*(.+?)(?=\[\d{2}:\d{2}:\d{2}\]|$)/gs;

    let match;
    while ((match = timestampPattern.exec(transcript)) !== null) {
      const timeStr = match[1];
      const text = match[2].trim();
      const startTime = this.parseTimestamp(timeStr);

      segments.push({
        text,
        startTime,
        endTime: startTime + 10, // Estimate, will be refined
      });
    }

    // If no timestamps found, split by sentences
    if (segments.length === 0) {
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());

      sentences.forEach((text, i) => {
        segments.push({
          text: text.trim(),
          startTime: i * 5,
          endTime: (i + 1) * 5,
        });
      });
    }

    // Refine end times based on next segment
    for (let i = 0; i < segments.length - 1; i++) {
      segments[i].endTime = segments[i + 1].startTime;
    }

    return segments;
  }

  /**
   * Score a transcript segment for teaching patterns
   */
  private scoreSegment(segment: TranscriptSegment): ScoredMoment {
    const text = segment.text.toLowerCase();
    let score = 0;
    const reasons: string[] = [];

    // Check high confidence patterns
    for (const pattern of TEACHING_PATTERNS.highConfidence) {
      if (text.includes(pattern)) {
        score += SCORE_WEIGHTS.highConfidence;
        reasons.push(`Teaching: "${pattern}"`);
      }
    }

    // Check medium confidence patterns
    for (const pattern of TEACHING_PATTERNS.mediumConfidence) {
      if (text.includes(pattern)) {
        score += SCORE_WEIGHTS.mediumConfidence;
        reasons.push(`Process: "${pattern}"`);
      }
    }

    // Check realization moments (high value!)
    for (const pattern of TEACHING_PATTERNS.realizationMoments) {
      if (text.includes(pattern)) {
        score += SCORE_WEIGHTS.realizationMoments;
        reasons.push(`Realization: "${pattern}"`);
      }
    }

    // Check technical terms (bonus when combined)
    let techTermCount = 0;
    for (const term of TEACHING_PATTERNS.technicalTerms) {
      if (text.includes(term)) {
        techTermCount++;
      }
    }
    if (techTermCount >= 2) {
      score += SCORE_WEIGHTS.technicalTerms * techTermCount;
      reasons.push(`Technical (${techTermCount} terms)`);
    }

    // Bonus for longer explanations
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 50) {
      score += SCORE_WEIGHTS.veryLongExplanation;
      reasons.push('Long explanation');
    } else if (wordCount > 30) {
      score += SCORE_WEIGHTS.longExplanation;
    }

    // Bonus for Q&A pattern
    if (text.includes('?') && text.includes('.')) {
      score += SCORE_WEIGHTS.questionAnswer;
      reasons.push('Q&A pattern');
    }

    return {
      startTime: segment.startTime,
      endTime: segment.endTime,
      score,
      reason: reasons.join('; ') || 'No patterns matched',
      source: 'transcript',
    };
  }

  /**
   * Cluster nearby moments into single highlights
   */
  private clusterMoments(
    moments: ScoredMoment[],
    gapThreshold: number
  ): ScoredMoment[] {
    if (moments.length === 0) return [];

    // Sort by start time
    const sorted = [...moments].sort((a, b) => a.startTime - b.startTime);

    const clusters: ScoredMoment[] = [];
    let current = { ...sorted[0] };

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];

      // If within gap threshold, merge
      if (next.startTime - current.endTime <= gapThreshold) {
        current.endTime = next.endTime;
        current.score += next.score;
        current.reason += '; ' + next.reason;
      } else {
        // Save current cluster and start new one
        clusters.push(current);
        current = { ...next };
      }
    }

    // Don't forget the last cluster
    clusters.push(current);

    // Expand clip boundaries (3s before, 5s after)
    return clusters.map(c => ({
      ...c,
      startTime: Math.max(0, c.startTime - 3),
      endTime: c.endTime + 5,
    }));
  }

  /**
   * Parse timestamp string to seconds
   */
  private parseTimestamp(timeStr: string): number {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  }

  /**
   * Fallback: Get transcript via yt-dlp
   */
  private async getYtDlpTranscript(videoUrl: string): Promise<string> {
    const videoId = youtubeService.extractVideoId(videoUrl);

    try {
      execSync(
        `yt-dlp --write-auto-sub --skip-download --sub-lang en -o "/tmp/${videoId}" "${videoUrl}" 2>&1`,
        { encoding: 'utf-8', timeout: 60000 }
      );

      const subFile = `/tmp/${videoId}.en.vtt`;

      if (fs.existsSync(subFile)) {
        const content = fs.readFileSync(subFile, 'utf-8');
        fs.unlinkSync(subFile);
        return this.parseVTT(content);
      }
    } catch (error) {
      console.log('[Transcript] yt-dlp subtitle extraction failed');
    }

    return '';
  }

  /**
   * Parse VTT subtitle format
   */
  private parseVTT(vtt: string): string {
    // Remove header and timing lines, extract text
    const lines = vtt.split('\n');
    const textLines: string[] = [];

    for (const line of lines) {
      // Skip timing lines and headers
      if (line.includes('-->') || line.startsWith('WEBVTT') || line.match(/^\d+$/)) {
        continue;
      }
      // Skip empty lines
      if (line.trim()) {
        textLines.push(line.trim());
      }
    }

    return textLines.join(' ');
  }
}

export const transcriptAnalyzer = new TranscriptAnalyzer();
