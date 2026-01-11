# Phase 5: VOD Multi-Clip with Dev Stream Detection

## Objective
Build an automated highlight detection system for dev streams that identifies clip-worthy moments based on teaching patterns (transcript) and screen activity (motion), then extracts multiple clips efficiently using the Download-Once, Split-Many approach.

---

## Context Files to Read First
1. `src/services/youtube-service.ts` - Video download and metadata
2. `src/services/youtube-workflow.ts` - Existing workflow patterns
3. `src/services/drive-service.ts` - Drive upload service
4. `src/types/youtube.ts` - Existing type definitions
5. `PLANNING/AI-CLIPPING-VOD-RESEARCH.md` - Background research

---

## Dependencies
- Phases 0-4 must be complete
- `yt-dlp` installed: `brew install yt-dlp`
- `ffmpeg` installed: `brew install ffmpeg`
- ScrapCreators API access (for transcripts)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                 Dev Stream Highlight Detection                    │
└──────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   TRANSCRIPT    │  │     MOTION      │  │     AUDIO       │
│   ANALYZER      │  │    ANALYZER     │  │   ANALYZER      │
│                 │  │                 │  │   (Optional)    │
│ • Teaching      │  │ • Scene changes │  │ • Speech ratio  │
│   phrases       │  │ • Frame diffs   │  │ • Silence→spike │
│ • Realizations  │  │ • Activity      │  │ • Volume        │
│ • Process       │  │   density       │  │   variance      │
│   narration     │  │                 │  │                 │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                 ┌─────────────────────────┐
                 │     SIGNAL FUSION       │
                 │                         │
                 │ • Combine scores        │
                 │ • Apply weights         │
                 │ • Classify clip type    │
                 │ • Rank highlights       │
                 └────────────┬────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │   DOWNLOAD ONCE,        │
                 │   SPLIT MANY            │
                 │                         │
                 │ • Download VOD segment  │
                 │ • FFmpeg split (fast)   │
                 │ • Parallel Drive upload │
                 └─────────────────────────┘
```

---

## Tasks

### Task 1: Create Highlight Detection Types

Create `src/types/highlights.ts`:

```typescript
import { z } from 'zod';

// Clip types specific to dev streams
export type DevStreamClipType = 
  | 'explanation'    // Teaching a concept
  | 'build_moment'   // Terminal output, builds, tests
  | 'aha_moment'     // Realization or discovery
  | 'demo'           // Explaining while coding
  | 'intro'          // Stream/topic introduction
  | 'summary';       // Wrapping up a concept

// Transcript segment from ScrapCreators
export interface TranscriptSegment {
  text: string;
  startTime: number;  // seconds
  endTime: number;
  confidence?: number;
}

// Scored moment from any analyzer
export interface ScoredMoment {
  startTime: number;
  endTime: number;
  score: number;
  reason: string;
  source: 'transcript' | 'motion' | 'audio';
}

// Motion analysis segment
export interface MotionSegment {
  startTime: number;
  endTime: number;
  motionScore: number;  // 0-100
  activityLevel: 'high' | 'medium' | 'low';
  sceneChanges: number;
}

// Audio analysis segment
export interface AudioSegment {
  startTime: number;
  endTime: number;
  speechRatio: number;      // 0-1
  averageVolume: number;    // dB
  volumeVariance: number;
  silenceBeforeSpike: boolean;
}

// Combined highlight after signal fusion
export interface DetectedHighlight {
  startTime: number;
  endTime: number;
  duration: number;
  totalScore: number;
  signals: {
    transcript: number;
    motion: number;
    audio: number;
  };
  clipType: DevStreamClipType;
  reason: string;
  confidence: number;  // 0-1
}

// API request/response schemas
export const DetectHighlightsRequestSchema = z.object({
  vodUrl: z.string().url(),
  options: z.object({
    maxClips: z.number().min(1).max(20).default(10),
    minScore: z.number().min(0).default(3),
    preferTypes: z.array(z.enum([
      'explanation', 'build_moment', 'aha_moment', 'demo', 'intro', 'summary'
    ])).optional(),
    analysisQuality: z.enum(['720', '480']).default('720'),
    skipMotionAnalysis: z.boolean().default(false),
  }).optional(),
});

export type DetectHighlightsRequest = z.infer<typeof DetectHighlightsRequestSchema>;

export interface DetectHighlightsResponse {
  vodId: string;
  vodTitle: string;
  vodDuration: number;
  analysisTime: number;
  highlights: DetectedHighlight[];
}

// Multi-clip extraction request
export const ExtractClipsRequestSchema = z.object({
  vodUrl: z.string().url(),
  clips: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
    name: z.string().optional(),
    type: z.string().optional(),
  })).min(1).max(50),
  quality: z.enum(['2160', '1440', '1080', '720', '480']).default('1080'),
  parallelUploads: z.boolean().default(true),
});

export type ExtractClipsRequest = z.infer<typeof ExtractClipsRequestSchema>;

export interface ExtractedClip {
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  driveFileId: string;
  driveUrl: string;
  folder: string;
}

export interface ExtractClipsResponse {
  vodId: string;
  vodTitle: string;
  totalClips: number;
  successful: number;
  failed: number;
  clips: ExtractedClip[];
  errors?: Array<{ clip: string; error: string }>;
  processingTime: number;
}
```

---

### Task 2: Create Teaching Pattern Config

Create `src/config/teaching-patterns.ts`:

```typescript
/**
 * Phrase patterns for detecting teaching/explanation moments
 * in dev stream transcripts.
 * 
 * Customize these based on your speaking style!
 */

export const TEACHING_PATTERNS = {
  // High confidence explanation starters (+3 score)
  highConfidence: [
    // Concept explanations
    "so what we're doing here is",
    "the reason for this is",
    "let me explain",
    "basically what's happening",
    "the key insight is",
    "here's the trick",
    "the important thing to understand",
    "what this does is",
    "the way this works is",
    "so the idea is",
    "here's why this matters",
    "the cool thing about this",
    "what's interesting here is",
    "the pattern here is",
    
    // Teaching mode
    "let me show you",
    "watch what happens when",
    "notice how",
    "pay attention to",
    "the thing to remember is",
    "keep in mind that",
  ],
  
  // Process narration (+1.5 score)
  mediumConfidence: [
    "first we need to",
    "next step is",
    "now we're going to",
    "let's see if this works",
    "okay so",
    "alright so",
    "the problem is",
    "the solution is",
    "what I'm thinking is",
    "my approach here is",
    "so now we",
    "and then we",
    "from here we",
    "at this point",
  ],
  
  // Realization/discovery moments (+4 score - high value!)
  realizationMoments: [
    "oh that's why",
    "ah I see",
    "wait that means",
    "oh interesting",
    "that's the issue",
    "found it",
    "there we go",
    "that's it",
    "boom",
    "perfect",
    "nice",
    "let's go",
    "there it is",
    "got it",
    "yes",
    "finally",
    "that worked",
  ],
  
  // Technical term indicators (+1 score when combined)
  technicalTerms: [
    "function",
    "component",
    "api",
    "endpoint",
    "database",
    "query",
    "hook",
    "state",
    "async",
    "promise",
    "typescript",
    "interface",
    "type",
    "import",
    "export",
    "module",
    "package",
    "dependency",
    "error",
    "debug",
  ],
};

// Scoring weights
export const SCORE_WEIGHTS = {
  highConfidence: 3.0,
  mediumConfidence: 1.5,
  realizationMoments: 4.0,
  technicalTerms: 0.5,
  longExplanation: 1.0,      // >30 words
  veryLongExplanation: 1.5,  // >50 words
  questionAnswer: 1.0,       // Contains ? and .
};

// Motion detection thresholds
export const MOTION_CONFIG = {
  sceneChangeThreshold: 0.1,    // FFmpeg scene detection sensitivity
  highActivityDensity: 0.5,     // Changes per second for "high"
  mediumActivityDensity: 0.2,   // Changes per second for "medium"
  windowSize: 10,               // Analysis window in seconds
  minActivityDuration: 3,       // Minimum seconds to count
};

// Signal fusion weights
export const FUSION_WEIGHTS = {
  transcript: 2.0,   // Explanations most valuable
  motion: 1.5,       // Active coding valuable
  audio: 1.0,        // Supporting signal
};

// Clip type classification thresholds
export const CLIP_TYPE_THRESHOLDS = {
  explanation: { transcript: 5, motion: 3 },      // High speech, low motion
  buildMoment: { transcript: 3, motion: 7 },      // Low speech, high motion
  demo: { transcript: 3, motion: 5 },             // Both present
  ahaMoment: { realizationScore: 4 },             // Realization pattern
};
```

---

### Task 3: Create Transcript Analyzer

Create `src/services/highlight-detection/transcript-analyzer.ts`:

```typescript
import { scrapCreatorsService } from '../scrapcreators-service';
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
    
    // Try ScrapCreators first (has timestamps)
    let transcript: string;
    try {
      transcript = await scrapCreatorsService.getTranscript(videoUrl);
    } catch (error) {
      console.log('[Transcript] ScrapCreators failed, trying yt-dlp...');
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
      const estimatedDuration = sentences.length * 5; // ~5 sec per sentence
      
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
    const { execSync } = require('child_process');
    const videoId = youtubeService.extractVideoId(videoUrl);
    
    try {
      const output = execSync(
        `yt-dlp --write-auto-sub --skip-download --sub-lang en -o "/tmp/${videoId}" "${videoUrl}" 2>&1`,
        { encoding: 'utf-8', timeout: 60000 }
      );
      
      const fs = require('fs');
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
```

---

### Task 4: Create Motion Analyzer

Create `src/services/highlight-detection/motion-analyzer.ts`:

```typescript
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
      const timestamps: number[] = [];
      const regex = /pts_time:([0-9.]+)/g;
      
      let match;
      while ((match = regex.exec(output)) !== null) {
        timestamps.push(parseFloat(match[1]));
      }
      
      return timestamps;
    } catch (error: any) {
      // FFmpeg often returns non-zero even on success
      if (error.stdout) {
        const timestamps: number[] = [];
        const regex = /pts_time:([0-9.]+)/g;
        
        let match;
        while ((match = regex.exec(error.stdout)) !== null) {
          timestamps.push(parseFloat(match[1]));
        }
        
        return timestamps;
      }
      
      console.error('[Motion] Scene detection failed:', error.message);
      return [];
    }
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
```

---

### Task 5: Create Signal Fusion Service

Create `src/services/highlight-detection/signal-fusion.ts`:

```typescript
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
```

---

### Task 6: Create Main Detection Service

Create `src/services/highlight-detection/index.ts`:

```typescript
import { youtubeService } from '../youtube-service';
import { transcriptAnalyzer } from './transcript-analyzer';
import { motionAnalyzer } from './motion-analyzer';
import { signalFusion } from './signal-fusion';
import { 
  DetectedHighlight, 
  DetectHighlightsRequest,
  DetectHighlightsResponse 
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
      let motionMoments: any[] = [];
      if (!skipMotionAnalysis) {
        console.log('\n[2/3] Downloading for motion analysis...');
        videoPath = await youtubeService.downloadVideo(
          vodUrl, 
          analysisQuality,
          'analysis'
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
```

---

### Task 7: Create VOD Multi-Clip Service

Create `src/services/vod-service.ts`:

```typescript
import { youtubeService } from './youtube-service';
import { driveService } from './drive-service';
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
          execSync(`
            ffmpeg -y \
              -ss ${relativeStart} \
              -i "${vodPath}" \
              -t ${duration} \
              -c copy \
              -avoid_negative_ts make_zero \
              "${outputPath}"
          `, { stdio: 'pipe' });
          
          clipPaths.push({ path: outputPath, name: clipName, clip });
        } catch (error: any) {
          console.error(`  Failed: ${clipName} - ${error.message}`);
          errors.push({ clip: clipName, error: error.message });
        }
      }
      
      console.log(`Extracted ${clipPaths.length}/${clips.length} clips`);
      
      // Step 3: Upload to Drive
      console.log('\n[3/3] Uploading to Google Drive...');
      
      if (parallelUploads) {
        // Parallel upload (faster for many clips)
        const uploadPromises = clipPaths.map(async ({ path: clipPath, name, clip }) => {
          try {
            const uploadResult = await driveService.uploadClip(
              clipPath,
              name,
              videoInfo.channel,
              new Date().toISOString()
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
          } catch (error: any) {
            errors.push({ clip: name, error: error.message });
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
              new Date().toISOString()
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
          } catch (error: any) {
            errors.push({ clip: name, error: error.message });
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
    const duration = endTime - startTime;
    
    // Use yt-dlp with download-sections
    const command = `
      yt-dlp "${vodUrl}" \
        --download-sections "*${this.formatTime(startTime)}-${this.formatTime(endTime)}" \
        -f "bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]" \
        --merge-output-format mp4 \
        -o "${outputPath}"
    `;
    
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
```

---

### Task 8: Create API Routes

Create `src/api/vod.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { highlightDetectionService } from '../services/highlight-detection';
import { vodService } from '../services/vod-service';
import { 
  DetectHighlightsRequestSchema,
  ExtractClipsRequestSchema 
} from '../types/highlights';

const router = Router();

/**
 * POST /api/vod/detect
 * Detect highlights in a dev stream VOD
 */
router.post('/detect', async (req: Request, res: Response) => {
  try {
    const parseResult = DetectHighlightsRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten(),
        },
      });
    }
    
    const result = await highlightDetectionService.detectHighlights(parseResult.data);
    
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Highlight detection error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DETECTION_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/vod/detect/quick
 * Quick detection using transcript only (faster)
 */
router.post('/detect/quick', async (req: Request, res: Response) => {
  try {
    const { vodUrl, maxClips = 10 } = req.body;
    
    if (!vodUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'vodUrl required' },
      });
    }
    
    const highlights = await highlightDetectionService.quickDetect(vodUrl, maxClips);
    
    return res.status(200).json({
      success: true,
      data: { highlights },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DETECTION_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/vod/extract
 * Extract multiple clips from a VOD
 */
router.post('/extract', async (req: Request, res: Response) => {
  try {
    const parseResult = ExtractClipsRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten(),
        },
      });
    }
    
    const result = await vodService.extractClips(parseResult.data);
    
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Clip extraction error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'EXTRACTION_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/vod/detect-and-extract
 * Full workflow: Detect highlights then extract all
 */
router.post('/detect-and-extract', async (req: Request, res: Response) => {
  try {
    const { vodUrl, maxClips = 10, minScore = 3, quality = '1080' } = req.body;
    
    if (!vodUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'vodUrl required' },
      });
    }
    
    // Step 1: Detect highlights
    console.log('Step 1: Detecting highlights...');
    const detection = await highlightDetectionService.detectHighlights({
      vodUrl,
      options: { maxClips, minScore },
    });
    
    if (detection.highlights.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'No highlights detected above threshold',
          detection,
          extraction: null,
        },
      });
    }
    
    // Step 2: Extract detected highlights
    console.log('Step 2: Extracting clips...');
    const clips = detection.highlights.map((h, i) => ({
      startTime: Math.floor(h.startTime).toString(),
      endTime: Math.ceil(h.endTime).toString(),
      name: `${h.clipType}-${i + 1}`,
      type: h.clipType,
    }));
    
    const extraction = await vodService.extractClips({
      vodUrl,
      clips,
      quality: quality as any,
    });
    
    return res.status(200).json({
      success: true,
      data: {
        detection,
        extraction,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'WORKFLOW_ERROR', message: error.message },
    });
  }
});

export default router;
```

---

### Task 9: Update Express App

Update `src/index.ts` to add VOD routes:

```typescript
import vodRouter from './api/vod';

// ... existing code ...

// API Routes
app.use('/api/clips', clipsRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/vod', vodRouter);  // Add this
```

---

### Task 10: Create Test Scripts

Create `scripts/test-detection.ts`:

```typescript
import { highlightDetectionService } from '../src/services/highlight-detection';

async function testDetection() {
  // Use a known dev stream VOD for testing
  const testUrl = process.argv[2] || 'YOUR_TEST_VOD_URL';
  
  console.log('=== Highlight Detection Test ===\n');
  
  try {
    // Test quick detection (transcript only)
    console.log('1. Testing quick detection...');
    const quickResults = await highlightDetectionService.quickDetect(testUrl, 5);
    console.log(`   Found ${quickResults.length} highlights:\n`);
    
    for (const h of quickResults) {
      console.log(`   [${h.clipType}] ${formatTime(h.startTime)} - ${formatTime(h.endTime)}`);
      console.log(`   Score: ${h.totalScore.toFixed(1)}, Confidence: ${(h.confidence * 100).toFixed(0)}%`);
      console.log(`   Reason: ${h.reason.slice(0, 100)}...\n`);
    }
    
    // Test full detection (with motion)
    console.log('\n2. Testing full detection (with motion analysis)...');
    const fullResults = await highlightDetectionService.detectHighlights({
      vodUrl: testUrl,
      options: {
        maxClips: 5,
        minScore: 3,
        analysisQuality: '480', // Lower quality for faster analysis
      },
    });
    
    console.log(`\n   Analysis time: ${fullResults.analysisTime.toFixed(1)}s`);
    console.log(`   Highlights found: ${fullResults.highlights.length}\n`);
    
    for (const h of fullResults.highlights) {
      console.log(`   [${h.clipType}] ${formatTime(h.startTime)} - ${formatTime(h.endTime)}`);
      console.log(`   Signals: T=${h.signals.transcript.toFixed(1)}, M=${h.signals.motion.toFixed(1)}`);
      console.log(`   Score: ${h.totalScore.toFixed(1)}\n`);
    }
    
    console.log('=== Detection test complete! ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

testDetection();
```

Create `scripts/test-vod-extract.ts`:

```typescript
import { vodService } from '../src/services/vod-service';

async function testVodExtract() {
  const testUrl = process.argv[2] || 'YOUR_TEST_VOD_URL';
  
  console.log('=== VOD Multi-Clip Extraction Test ===\n');
  
  try {
    const result = await vodService.extractClips({
      vodUrl: testUrl,
      clips: [
        { startTime: '0:00', endTime: '0:15', name: 'intro' },
        { startTime: '1:00', endTime: '1:30', name: 'segment-1' },
        { startTime: '2:00', endTime: '2:20', name: 'segment-2' },
      ],
      quality: '720',
    });
    
    console.log('\n=== Results ===');
    console.log(`Successful: ${result.successful}/${result.totalClips}`);
    console.log(`Processing time: ${result.processingTime.toFixed(1)}s`);
    
    for (const clip of result.clips) {
      console.log(`\n${clip.name}:`);
      console.log(`  ${clip.driveUrl}`);
    }
    
    if (result.errors) {
      console.log('\nErrors:');
      for (const e of result.errors) {
        console.log(`  ${e.clip}: ${e.error}`);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testVodExtract();
```

---

## Success Criteria

- [ ] `src/types/highlights.ts` created with all types
- [ ] `src/config/teaching-patterns.ts` created with patterns
- [ ] `src/services/highlight-detection/` directory with all analyzers
- [ ] `src/services/vod-service.ts` created
- [ ] `src/api/vod.ts` created with routes
- [ ] `npm run typecheck` passes
- [ ] `npm run test:detection` runs successfully
- [ ] `POST /api/vod/detect` returns highlights
- [ ] `POST /api/vod/extract` extracts multiple clips

---

## Verification Commands

```bash
# Type check
npm run typecheck

# Test detection only
npm run test:detection "https://youtube.com/watch?v=YOUR_VOD_ID"

# Test extraction only
npm run test:vod-extract "https://youtube.com/watch?v=YOUR_VOD_ID"

# Test via API
npm run dev  # Terminal 1

# Detect highlights
curl -X POST http://localhost:3000/api/vod/detect \
  -H "Content-Type: application/json" \
  -d '{"vodUrl": "https://youtube.com/watch?v=ID"}'

# Full workflow
curl -X POST http://localhost:3000/api/vod/detect-and-extract \
  -H "Content-Type: application/json" \
  -d '{"vodUrl": "https://youtube.com/watch?v=ID", "maxClips": 5}'
```

---

## Git Commit

```bash
git add -A
git commit -m "Phase 5: VOD multi-clip with dev stream highlight detection"
```
