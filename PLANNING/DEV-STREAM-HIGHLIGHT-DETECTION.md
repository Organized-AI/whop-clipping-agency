# Dev Stream Highlight Detection System

**Purpose:** Automatically detect clip-worthy moments in live software development streams  
**Target Content:** Planning sessions, coding, builds, explanations  
**Stack:** TypeScript, yt-dlp, ffmpeg, ScrapCreators API

---

## Detection Signals for Dev Streams

Unlike gaming streams (kills, reactions), dev streams have unique patterns:

| Signal | What It Indicates | Detection Method |
|--------|-------------------|------------------|
| **Teaching phrases** | Explaining concepts | Transcript keyword matching |
| **Terminal activity** | Builds, tests, installs | Visual motion detection |
| **Code scrolling** | Active development | Frame difference analysis |
| **Sustained speech** | Thought process narration | Audio energy + duration |
| **Silence → speech** | "Aha!" moments | Audio pattern change |
| **Screen transitions** | Switching contexts | Scene change detection |

---

## Part 1: Transcript-Based Detection

### Teaching Pattern Keywords

These phrases signal "explanation mode" - prime clip material:

```typescript
const TEACHING_PATTERNS = {
  // Explanation starters (high confidence)
  highConfidence: [
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
  ],
  
  // Process narration (medium confidence)
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
  ],
  
  // Realization moments (high value)
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
  ],
  
  // Technical explanations
  technicalPatterns: [
    "this function",
    "this component",
    "the api",
    "the endpoint",
    "the database",
    "the query",
    "the hook",
    "the state",
    "async",
    "promise",
    "typescript",
  ],
};
```

### Transcript Scoring Algorithm

```typescript
interface TranscriptSegment {
  text: string;
  startTime: number;  // seconds
  endTime: number;
  confidence: number; // 0-1 from speech recognition
}

interface ScoredMoment {
  startTime: number;
  endTime: number;
  score: number;
  reason: string;
  type: 'explanation' | 'realization' | 'technical';
}

function scoreTranscriptSegment(segment: TranscriptSegment): number {
  const text = segment.text.toLowerCase();
  let score = 0;
  let reasons: string[] = [];
  
  // Check high confidence patterns (+3 each)
  for (const pattern of TEACHING_PATTERNS.highConfidence) {
    if (text.includes(pattern)) {
      score += 3;
      reasons.push(`Teaching: "${pattern}"`);
    }
  }
  
  // Check medium confidence patterns (+1.5 each)
  for (const pattern of TEACHING_PATTERNS.mediumConfidence) {
    if (text.includes(pattern)) {
      score += 1.5;
      reasons.push(`Process: "${pattern}"`);
    }
  }
  
  // Check realization moments (+4 each - high value!)
  for (const pattern of TEACHING_PATTERNS.realizationMoments) {
    if (text.includes(pattern)) {
      score += 4;
      reasons.push(`Realization: "${pattern}"`);
    }
  }
  
  // Bonus for longer explanations (sustained teaching)
  const wordCount = text.split(' ').length;
  if (wordCount > 30) score += 1;
  if (wordCount > 50) score += 1;
  
  // Bonus for question + answer pattern
  if (text.includes('?') && text.includes('.')) {
    score += 1;
    reasons.push('Q&A pattern');
  }
  
  return score;
}

async function detectExplanatoryMoments(
  videoUrl: string
): Promise<ScoredMoment[]> {
  // 1. Get transcript from ScrapCreators
  const transcript = await scrapCreatorsService.getTranscript(videoUrl);
  
  // 2. Parse into segments (typically 5-10 second chunks)
  const segments = parseTranscriptToSegments(transcript);
  
  // 3. Score each segment
  const scored = segments.map(seg => ({
    ...seg,
    score: scoreTranscriptSegment(seg)
  }));
  
  // 4. Find peaks (score > threshold)
  const threshold = 3; // Adjustable
  const peaks = scored.filter(s => s.score >= threshold);
  
  // 5. Cluster nearby peaks into moments
  const moments = clusterMoments(peaks, gapThreshold: 15);
  
  // 6. Expand to clip boundaries (start 3s before, end 5s after)
  return moments.map(m => ({
    startTime: Math.max(0, m.startTime - 3),
    endTime: m.endTime + 5,
    score: m.score,
    reason: m.reasons.join(', '),
    type: categorizeType(m)
  }));
}
```

---

## Part 2: Visual Motion Detection

### Detecting Active Code/Terminal Activity

When you're running builds, tests, or npm installs, the screen has rapid text scrolling. This is detectable!

```typescript
import { execSync } from 'child_process';

interface MotionSegment {
  startTime: number;
  endTime: number;
  motionScore: number;  // 0-100
  type: 'high_activity' | 'medium_activity' | 'low_activity';
}

async function detectScreenMotion(videoPath: string): Promise<MotionSegment[]> {
  // FFmpeg scene change detection
  // This outputs timestamps where significant visual changes occur
  
  const command = `
    ffmpeg -i "${videoPath}" \
      -vf "select='gt(scene,0.1)',showinfo" \
      -f null - 2>&1 | \
      grep showinfo | \
      grep -oP 'pts_time:\\K[0-9.]+'
  `;
  
  const output = execSync(command).toString();
  const sceneChanges = output.trim().split('\n').map(Number);
  
  // Calculate motion density per 10-second window
  const windows = calculateMotionDensity(sceneChanges, windowSize: 10);
  
  // High motion = likely terminal output, builds, active coding
  return windows.map(w => ({
    startTime: w.start,
    endTime: w.end,
    motionScore: w.density * 100,
    type: w.density > 0.5 ? 'high_activity' : 
          w.density > 0.2 ? 'medium_activity' : 'low_activity'
  }));
}

function calculateMotionDensity(
  sceneChanges: number[], 
  windowSize: number
): { start: number; end: number; density: number }[] {
  const maxTime = Math.max(...sceneChanges);
  const windows = [];
  
  for (let start = 0; start < maxTime; start += windowSize / 2) {
    const end = start + windowSize;
    const changesInWindow = sceneChanges.filter(
      t => t >= start && t < end
    ).length;
    
    // Density = changes per second
    const density = changesInWindow / windowSize;
    
    windows.push({ start, end, density });
  }
  
  return windows;
}
```

### Frame Difference Analysis (More Precise)

For detecting rapid code scrolling specifically:

```typescript
async function detectCodeScrolling(videoPath: string): Promise<MotionSegment[]> {
  // Extract frames at 2 fps (efficient)
  const framesDir = '/tmp/frames';
  await execAsync(`
    mkdir -p ${framesDir} && \
    ffmpeg -i "${videoPath}" -vf "fps=2" ${framesDir}/frame_%04d.png
  `);
  
  // Compare consecutive frames
  const differences: { time: number; diff: number }[] = [];
  const frames = fs.readdirSync(framesDir).sort();
  
  for (let i = 1; i < frames.length; i++) {
    const prev = `${framesDir}/${frames[i-1]}`;
    const curr = `${framesDir}/${frames[i]}`;
    
    // ImageMagick compare (or use sharp/jimp in Node)
    const diff = await getFrameDifference(prev, curr);
    
    differences.push({
      time: i * 0.5,  // 2 fps = 0.5s per frame
      diff: diff
    });
  }
  
  // Find sustained high-difference periods (terminal scrolling)
  const highActivity = differences.filter(d => d.diff > 0.15);
  
  // Cluster into segments
  return clusterDifferences(highActivity);
}

async function getFrameDifference(frame1: string, frame2: string): Promise<number> {
  // Using ImageMagick compare
  const result = execSync(`
    compare -metric RMSE "${frame1}" "${frame2}" null: 2>&1 || true
  `).toString();
  
  // Parse RMSE value (0-1 scale)
  const match = result.match(/\(([0-9.]+)\)/);
  return match ? parseFloat(match[1]) : 0;
}
```

---

## Part 3: Combined Scoring System

### Multi-Signal Fusion

The best clips happen when **multiple signals align**:

```typescript
interface CombinedMoment {
  startTime: number;
  endTime: number;
  totalScore: number;
  signals: {
    transcript: number;
    motion: number;
    audio: number;
  };
  clipType: 'explanation' | 'build_moment' | 'aha_moment' | 'demo';
  reason: string;
}

async function detectHighlights(videoUrl: string): Promise<CombinedMoment[]> {
  console.log('=== Dev Stream Highlight Detection ===\n');
  
  // 1. Download video for analysis
  console.log('[1/4] Downloading video...');
  const videoPath = await downloadVideo(videoUrl, '720'); // Lower quality for analysis
  
  // 2. Get transcript scores
  console.log('[2/4] Analyzing transcript...');
  const transcriptMoments = await detectExplanatoryMoments(videoUrl);
  
  // 3. Get motion scores
  console.log('[3/4] Analyzing screen motion...');
  const motionSegments = await detectScreenMotion(videoPath);
  
  // 4. Get audio patterns (optional enhancement)
  console.log('[4/4] Analyzing audio patterns...');
  const audioSegments = await detectAudioPatterns(videoPath);
  
  // 5. Combine signals
  console.log('\nCombining signals...');
  const combined = fuseSignals(transcriptMoments, motionSegments, audioSegments);
  
  // 6. Rank and filter
  const topMoments = combined
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10); // Top 10 highlights
  
  // Cleanup
  fs.unlinkSync(videoPath);
  
  return topMoments;
}

function fuseSignals(
  transcript: ScoredMoment[],
  motion: MotionSegment[],
  audio: AudioSegment[]
): CombinedMoment[] {
  // Create time-based buckets (10 second windows)
  const buckets = new Map<number, CombinedMoment>();
  
  // Add transcript scores
  for (const t of transcript) {
    const bucket = Math.floor(t.startTime / 10) * 10;
    const existing = buckets.get(bucket) || createEmptyMoment(bucket);
    existing.signals.transcript += t.score;
    existing.reason += t.reason + '; ';
    buckets.set(bucket, existing);
  }
  
  // Add motion scores
  for (const m of motion) {
    const bucket = Math.floor(m.startTime / 10) * 10;
    const existing = buckets.get(bucket) || createEmptyMoment(bucket);
    existing.signals.motion += m.motionScore / 10; // Normalize
    if (m.type === 'high_activity') {
      existing.reason += 'High screen activity; ';
    }
    buckets.set(bucket, existing);
  }
  
  // Calculate total scores with weights
  const WEIGHTS = {
    transcript: 2.0,  // Explanations are most valuable
    motion: 1.5,      // Active coding is valuable
    audio: 1.0        // Audio patterns are supporting
  };
  
  for (const moment of buckets.values()) {
    moment.totalScore = 
      moment.signals.transcript * WEIGHTS.transcript +
      moment.signals.motion * WEIGHTS.motion +
      moment.signals.audio * WEIGHTS.audio;
    
    // Classify clip type
    moment.clipType = classifyClipType(moment);
  }
  
  return Array.from(buckets.values());
}

function classifyClipType(moment: CombinedMoment): string {
  const { transcript, motion } = moment.signals;
  
  if (transcript > 5 && motion < 3) return 'explanation';
  if (motion > 7 && transcript < 3) return 'build_moment';
  if (transcript > 3 && motion > 5) return 'demo'; // Explaining while doing
  if (moment.reason.includes('Realization')) return 'aha_moment';
  
  return 'explanation';
}
```

---

## Part 4: Audio Pattern Detection

### Detecting Teaching Cadence

Teaching voice has distinct patterns vs reading/thinking:

```typescript
interface AudioSegment {
  startTime: number;
  endTime: number;
  speechRatio: number;      // % of time with speech
  averageVolume: number;    // dB
  volumeVariance: number;   // High = expressive
  silenceBeforeSpike: boolean; // Aha moment pattern
}

async function detectAudioPatterns(videoPath: string): Promise<AudioSegment[]> {
  // Extract audio energy per second
  const command = `
    ffmpeg -i "${videoPath}" \
      -af "astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-" \
      -f null - 2>&1
  `;
  
  const output = execSync(command).toString();
  const energyLevels = parseAudioEnergy(output);
  
  // Analyze patterns
  const segments: AudioSegment[] = [];
  const windowSize = 10; // 10 second windows
  
  for (let i = 0; i < energyLevels.length; i += windowSize) {
    const window = energyLevels.slice(i, i + windowSize);
    
    // Calculate metrics
    const speechRatio = window.filter(e => e > -30).length / window.length;
    const avgVolume = average(window);
    const variance = calculateVariance(window);
    
    // Check for silence → speech pattern (aha moment)
    const silenceBeforeSpike = 
      i > 0 && 
      energyLevels[i - 1] < -40 && 
      window[0] > -25;
    
    segments.push({
      startTime: i,
      endTime: i + windowSize,
      speechRatio,
      averageVolume: avgVolume,
      volumeVariance: variance,
      silenceBeforeSpike
    });
  }
  
  return segments;
}
```

---

## Part 5: Implementation Plan

### Service Architecture

```
src/services/
├── highlight-detection/
│   ├── transcript-analyzer.ts   # Teaching pattern detection
│   ├── motion-analyzer.ts       # Screen activity detection
│   ├── audio-analyzer.ts        # Speech pattern analysis
│   ├── signal-fusion.ts         # Combine all signals
│   └── index.ts                 # Main detection service
├── vod-service.ts               # Download-once, split-many
└── youtube-workflow.ts          # Existing workflow
```

### API Design

```typescript
// POST /api/vod/detect-highlights
interface DetectHighlightsRequest {
  vodUrl: string;
  options?: {
    maxClips?: number;           // Default: 10
    minScore?: number;           // Default: 5
    preferTypes?: ClipType[];    // ['explanation', 'aha_moment']
    analysisQuality?: '720' | '480'; // Lower = faster
  };
}

interface DetectHighlightsResponse {
  success: boolean;
  data: {
    vodId: string;
    vodTitle: string;
    duration: number;
    analysisTime: number;
    highlights: Array<{
      startTime: string;
      endTime: string;
      duration: number;
      score: number;
      type: ClipType;
      reason: string;
      preview?: string;  // Thumbnail URL
    }>;
  };
}

// POST /api/vod/extract-highlights
// Uses detected highlights + Download-Once-Split-Many
interface ExtractHighlightsRequest {
  vodUrl: string;
  highlights: Array<{
    startTime: string;
    endTime: string;
    name?: string;
  }>;
  quality?: '1080' | '720' | '480';
}
```

### Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Dev Stream Clipping Workflow                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 1. DETECTION PHASE (Lightweight)                                 │
│    - Download 720p for analysis                                  │
│    - Run transcript analyzer (ScrapCreators)                     │
│    - Run motion analyzer (FFmpeg scene detection)                │
│    - Run audio analyzer (FFmpeg audio stats)                     │
│    - Fuse signals → Ranked highlights                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. REVIEW PHASE (Optional)                                       │
│    - Present highlights with timestamps                          │
│    - Allow manual adjustment                                     │
│    - Add/remove clips                                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. EXTRACTION PHASE (Download Once, Split Many)                  │
│    - Download 1080p segment covering all clips                   │
│    - FFmpeg split with stream copy (instant)                     │
│    - Parallel upload to Google Drive                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. OUTPUT                                                        │
│    - Clips in Drive folder                                       │
│    - Metadata JSON                                               │
│    - Optional: Auto-post to social                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Quick Start Implementation

### Phase 5A: Transcript Detection Only (Fastest to Build)

Start with just transcript analysis - it catches the most valuable moments:

```typescript
// src/services/highlight-detection/transcript-analyzer.ts

import { scrapCreatorsService } from '../scrapcreators-service';

export async function detectTeachingMoments(
  videoUrl: string
): Promise<HighlightMoment[]> {
  // Get transcript
  const transcript = await scrapCreatorsService.getTranscript(videoUrl);
  
  // Score segments
  const moments = scoreTranscript(transcript);
  
  // Return top moments
  return moments
    .filter(m => m.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
```

### Phase 5B: Add Motion Detection

Then layer on motion detection for build/terminal moments:

```typescript
// src/services/highlight-detection/motion-analyzer.ts

export async function detectActiveCodeMoments(
  videoPath: string
): Promise<HighlightMoment[]> {
  // FFmpeg scene detection
  const sceneChanges = await getSceneChanges(videoPath);
  
  // Find high-density windows
  return findHighActivityWindows(sceneChanges);
}
```

### Phase 5C: Signal Fusion

Finally, combine for best results:

```typescript
// src/services/highlight-detection/index.ts

export async function detectDevStreamHighlights(
  vodUrl: string
): Promise<CombinedHighlight[]> {
  // Run analyzers in parallel
  const [transcriptMoments, motionMoments] = await Promise.all([
    detectTeachingMoments(vodUrl),
    detectActiveCodeMoments(await downloadForAnalysis(vodUrl))
  ]);
  
  // Fuse and rank
  return fuseAndRank(transcriptMoments, motionMoments);
}
```

---

## Tuning for Your Streams

### Custom Teaching Patterns

Add your personal phrases:

```typescript
const JORDAN_PATTERNS = {
  highConfidence: [
    "so what we're gonna do",
    "the way I think about this",
    "here's the play",
    "let me show you",
    "check this out",
    // Add your common phrases
  ],
  
  realizationMoments: [
    "there it is",
    "boom",
    "let's go",
    "nice",
    "perfect",
    // Your reaction phrases
  ]
};
```

### Motion Thresholds

Tune based on your IDE/terminal setup:

```typescript
const MOTION_CONFIG = {
  sceneChangeThreshold: 0.1,  // Lower = more sensitive
  highActivityDensity: 0.5,   // Changes per second
  windowSize: 10,             // Analysis window
  
  // Ignore transitions (OBS scenes, etc.)
  ignoreQuickFlashes: true,
  minActivityDuration: 3,     // Seconds
};
```

---

## Summary

| Component | Purpose | Complexity | Value |
|-----------|---------|------------|-------|
| **Transcript Analysis** | Detect explanations | Low | Very High |
| **Motion Detection** | Detect builds/coding | Medium | High |
| **Audio Analysis** | Detect aha moments | Medium | Medium |
| **Signal Fusion** | Combine for accuracy | Medium | Very High |

**Start with transcript analysis** - it's the lowest effort with highest value for dev streams!
