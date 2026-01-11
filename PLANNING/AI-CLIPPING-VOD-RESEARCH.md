# AI Auto-Clipping & VOD Multi-Clip Research

**Research Date:** January 11, 2026  
**Purpose:** Feature expansion for whop-clipping-agency  
**Current Stack:** TypeScript, yt-dlp, ScrapCreators API, Google Drive API

---

## Part 1: AI Auto-Clipping Options

### Overview

AI auto-clipping uses machine learning to automatically identify "highlight moments" in video content without manual timestamp selection. These systems analyze multiple signals to find shareable moments.

---

### Detection Signals Used by AI Clippers

| Signal Type | What It Detects | Best For |
|-------------|-----------------|----------|
| **Audio Peaks** | Loud reactions, screams, laughter | Gaming, reactions |
| **Chat Velocity** | Spike in messages per second | Twitch streams |
| **Chat Sentiment** | Emote storms (PogChamp, LUL) | Viral moments |
| **Game Events** | Kills, victories, deaths | Gaming content |
| **Face Detection** | Emotional expressions | IRL/reaction content |
| **Speech Analysis** | Quotable phrases, punchlines | Podcasts, interviews |
| **Visual Motion** | Fast action, scene changes | Action content |

---

### Commercial AI Clipping Services

#### 1. StreamLadder ClipGPT
**Website:** https://streamladder.com/clipgpt

| Aspect | Details |
|--------|---------|
| **How It Works** | Paste VOD link → AI scans → Returns 10 clip suggestions |
| **Platforms** | Twitch, Kick, YouTube |
| **API Available** | ❌ No public API |
| **Pricing** | Free tier (watermark), $9.99/mo Pro |
| **Output** | Timestamps + descriptions + confidence scores |
| **Integration** | Manual only (copy timestamps) |

**Pros:**
- Very accurate for gaming content
- Explains why each moment was selected
- Built-in vertical video editor

**Cons:**
- No API for automation
- Limited to 10 clips per VOD
- Requires manual export

---

#### 2. Eklipse
**Website:** https://eklipse.gg

| Aspect | Details |
|--------|---------|
| **How It Works** | Connect Twitch/Kick → Auto-generates clips post-stream |
| **Platforms** | Twitch, Kick, YouTube |
| **API Available** | ❌ No public API |
| **Pricing** | Free (720p, 15 clips), $7.99/mo (1080p, unlimited) |
| **Games Supported** | 1000+ games with specific detection |
| **Special Features** | Voice commands ("Clip that!"), facecam detection |

**Pros:**
- Best game-specific detection (knows kill feeds, victory screens)
- Automatic processing after stream ends
- 1440p support on premium

**Cons:**
- No API access
- Tied to connected accounts
- Processing delay (not real-time)

---

#### 3. Sizzle.gg
**Website:** https://sizzle.gg

| Aspect | Details |
|--------|---------|
| **How It Works** | Connect accounts → Automatic highlight compilation |
| **Platforms** | Twitch, YouTube, local files |
| **API Available** | ⚠️ Limited (webhook notifications) |
| **Pricing** | Free tier, Premium $4.99/mo |
| **Special Features** | Auto-compilation videos, custom filters |

**Pros:**
- Cheapest premium option
- Creates compilation videos automatically
- Supports local file upload

**Cons:**
- Less accurate than competitors
- Limited customization
- No timestamp export

---

#### 4. Framedrop.ai
**Website:** https://framedrop.ai

| Aspect | Details |
|--------|---------|
| **How It Works** | Upload video → AI detects moments → Export clips |
| **Platforms** | Any video file, live streams |
| **API Available** | ✅ Enterprise API (contact sales) |
| **Pricing** | Enterprise only |
| **Special Features** | News/sports focus, article generation |

**Pros:**
- Has API (enterprise)
- Works on any content type
- CMS integration

**Cons:**
- Enterprise pricing
- Not gaming-focused
- Requires sales contact

---

#### 5. Vizard.ai
**Website:** https://vizard.ai

| Aspect | Details |
|--------|---------|
| **How It Works** | Upload long video → AI creates multiple shorts |
| **Platforms** | Any video (YouTube, Twitch, uploads) |
| **API Available** | ✅ API available |
| **Pricing** | Free (2 hrs/mo), $20/mo (10 hrs), $50/mo (30 hrs) |
| **Special Features** | Auto-captions, vertical reformatting |

**Pros:**
- API available for automation
- Works on any content
- Built-in caption generation

**Cons:**
- Hour-based limits
- More expensive
- General-purpose (not gaming-optimized)

---

### Build Your Own: Technical Approaches

#### Approach A: Chat Spike Analysis (Twitch)

```typescript
interface ChatAnalysis {
  timestamp: number;
  messagesPerSecond: number;
  emoteRatio: number;
  sentimentScore: number;
}

async function detectHighlights(vodId: string): Promise<Highlight[]> {
  // 1. Fetch chat logs from Twitch API or third-party
  const chatLogs = await fetchTwitchChat(vodId);
  
  // 2. Calculate messages per second in rolling windows
  const windows = calculateRollingWindows(chatLogs, windowSize: 10);
  
  // 3. Find spikes (>2x average)
  const spikes = windows.filter(w => w.messagesPerSecond > avgMPS * 2);
  
  // 4. Cluster nearby spikes into moments
  const moments = clusterSpikes(spikes, minGap: 30);
  
  // 5. Expand to clip timestamps (start 5s before, end 15s after)
  return moments.map(m => ({
    startTime: m.peakTime - 5,
    endTime: m.peakTime + 15,
    confidence: m.spikeIntensity,
    reason: `Chat spike: ${m.messagesPerSecond} msg/s`
  }));
}
```

**Data Sources for Twitch Chat:**
- Twitch API (requires OAuth)
- TwitchTracker archives
- Chatty logs (local)
- Third-party: logs.ivr.fi

---

#### Approach B: Audio Analysis

```typescript
import { spawn } from 'child_process';

async function detectAudioPeaks(videoPath: string): Promise<Highlight[]> {
  // 1. Extract audio with ffmpeg
  const audioPath = await extractAudio(videoPath);
  
  // 2. Analyze volume levels
  const volumeData = await analyzeVolume(audioPath);
  // ffmpeg -i video.mp4 -af "volumedetect" -f null -
  
  // 3. Find peaks above threshold
  const peaks = volumeData.filter(v => v.db > avgDb + 6);
  
  // 4. Convert to timestamps
  return peaks.map(p => ({
    startTime: p.timestamp - 3,
    endTime: p.timestamp + 10,
    confidence: (p.db - avgDb) / 10,
    reason: `Audio peak: +${p.db - avgDb}dB`
  }));
}

// FFmpeg command for volume analysis
// ffmpeg -i input.mp4 -af "astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.Peak_level" -f null -
```

---

#### Approach C: Transcript Keyword Detection

```typescript
async function detectQuotableMoments(videoUrl: string): Promise<Highlight[]> {
  // 1. Get transcript via ScrapCreators
  const transcript = await scrapCreators.getTranscript(videoUrl);
  
  // 2. Parse into timestamped segments
  const segments = parseTranscript(transcript);
  
  // 3. Score each segment for "quotability"
  const scored = segments.map(seg => ({
    ...seg,
    score: calculateQuotabilityScore(seg.text)
  }));
  
  // Quotability signals:
  // - Short sentences (< 15 words)
  // - Contains strong emotions (!, ?)
  // - Contains numbers/stats
  // - Contains names
  // - Sentiment extremes (very positive/negative)
  
  // 4. Return top moments
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(s => ({
      startTime: s.start,
      endTime: s.end,
      confidence: s.score,
      reason: `Quotable: "${s.text.slice(0, 50)}..."`
    }));
}
```

---

### Recommendation Matrix

| Use Case | Recommended Solution | Why |
|----------|---------------------|-----|
| **Gaming clips (Twitch)** | Eklipse | Best game-specific detection |
| **Any content + API needed** | Vizard.ai | Has API, general-purpose |
| **Budget option** | StreamLadder Free | Good quality, manual workflow |
| **Full automation** | Build chat spike analyzer | Free, customizable, API-friendly |
| **Enterprise/news** | Framedrop | Professional features |

---

## Part 2: VOD Multi-Clip Extraction

### Overview

VOD multi-clipping extracts multiple clips from a single long video (VOD) based on a list of timestamps. This is more efficient than downloading the same video multiple times.

---

### Architecture

```
                    ┌─────────────────────────────────────┐
                    │         VOD Multi-Clip System       │
                    └─────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
           ┌───────────────┐                  ┌───────────────┐
           │  Timestamp    │                  │  Full VOD     │
           │  Input        │                  │  Download     │
           │  (manual/AI)  │                  │  (optional)   │
           └───────┬───────┘                  └───────┬───────┘
                   │                                   │
                   └─────────────┬─────────────────────┘
                                 ▼
                    ┌─────────────────────────────────────┐
                    │         FFmpeg Split Engine         │
                    │  - Parallel processing              │
                    │  - Stream copy (no re-encode)       │
                    │  - Batch output                     │
                    └─────────────────────────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
    ┌────────────┐       ┌────────────┐       ┌────────────┐
    │  Clip 1    │       │  Clip 2    │       │  Clip 3    │
    │  0:00-0:30 │       │  5:00-5:45 │       │  12:30-13:00│
    └─────┬──────┘       └─────┬──────┘       └─────┬──────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                    ┌─────────────────────────────────────┐
                    │      Google Drive Batch Upload      │
                    │  - Date folder organization         │
                    │  - Parallel uploads                 │
                    └─────────────────────────────────────┘
```

---

### Implementation Strategy

#### Option A: Download-Once, Split-Many (Recommended)

```typescript
interface MultiClipRequest {
  vodUrl: string;
  clips: Array<{
    startTime: string;
    endTime: string;
    name?: string;
  }>;
  quality: YouTubeQuality;
}

async function extractMultipleClips(request: MultiClipRequest): Promise<ClipResult[]> {
  const { vodUrl, clips, quality } = request;
  
  // 1. Calculate total range needed
  const minStart = Math.min(...clips.map(c => parseTimestamp(c.startTime)));
  const maxEnd = Math.max(...clips.map(c => parseTimestamp(c.endTime)));
  
  // 2. Download the needed portion once
  console.log(`Downloading VOD segment: ${minStart}s - ${maxEnd}s`);
  const vodPath = await downloadVodSegment(vodUrl, minStart - 5, maxEnd + 5, quality);
  
  // 3. Split into individual clips with ffmpeg
  const results: ClipResult[] = [];
  
  for (const clip of clips) {
    const outputPath = generateOutputPath(clip);
    
    // FFmpeg with stream copy (instant, no re-encode)
    await execAsync(`
      ffmpeg -y \
        -ss ${parseTimestamp(clip.startTime) - minStart + 5} \
        -i "${vodPath}" \
        -t ${parseTimestamp(clip.endTime) - parseTimestamp(clip.startTime)} \
        -c copy \
        -avoid_negative_ts make_zero \
        "${outputPath}"
    `);
    
    // Upload to Drive
    const driveResult = await driveService.uploadClip(outputPath, clip.name);
    results.push(driveResult);
    
    // Cleanup individual clip
    fs.unlinkSync(outputPath);
  }
  
  // 4. Cleanup VOD segment
  fs.unlinkSync(vodPath);
  
  return results;
}
```

**Advantages:**
- Downloads video only once
- FFmpeg stream copy is instant (no re-encoding)
- Parallel uploads possible

---

#### Option B: Direct yt-dlp Sections (Simpler)

```typescript
async function extractClipsDirectly(request: MultiClipRequest): Promise<ClipResult[]> {
  const { vodUrl, clips, quality } = request;
  const results: ClipResult[] = [];
  
  // Download each clip directly (slower but simpler)
  for (const clip of clips) {
    const outputPath = generateOutputPath(clip);
    
    await execAsync(`
      yt-dlp "${vodUrl}" \
        --download-sections "*${clip.startTime}-${clip.endTime}" \
        -f "bestvideo[height<=${quality}]+bestaudio" \
        --merge-output-format mp4 \
        -o "${outputPath}"
    `);
    
    const driveResult = await driveService.uploadClip(outputPath, clip.name);
    results.push(driveResult);
    
    fs.unlinkSync(outputPath);
  }
  
  return results;
}
```

**Advantages:**
- Simpler code
- No temp storage for full VOD

**Disadvantages:**
- Downloads same video multiple times
- Slower for many clips

---

### Performance Comparison

| Scenario | Option A (Download Once) | Option B (Direct) |
|----------|-------------------------|-------------------|
| **5 clips from 2hr VOD** | ~3 min download + 5s splits | ~15 min (3 min × 5) |
| **20 clips from 4hr VOD** | ~6 min download + 20s splits | ~60 min (3 min × 20) |
| **Storage needed** | Full segment temp | Minimal |
| **Network usage** | Optimal | 5-20x more |

---

### API Design for Multi-Clip

```typescript
// POST /api/vod/multi-clip
interface MultiClipApiRequest {
  vodUrl: string;  // YouTube or Twitch VOD
  clips: Array<{
    startTime: string;   // "1:30:45" or "5445"
    endTime: string;
    name?: string;       // Optional clip name
    tags?: string[];     // Optional tags for organization
  }>;
  quality?: '2160' | '1440' | '1080' | '720' | '480';
  folder?: string;       // Optional Drive subfolder
  parallel?: boolean;    // Upload clips in parallel
}

// Response
interface MultiClipApiResponse {
  success: boolean;
  data: {
    vodId: string;
    vodTitle: string;
    totalClips: number;
    successful: number;
    failed: number;
    clips: Array<{
      name: string;
      startTime: string;
      endTime: string;
      duration: number;
      driveUrl: string;
      driveFileId: string;
    }>;
    errors?: Array<{
      clip: string;
      error: string;
    }>;
    processingTime: number;
  };
}
```

---

### Input Methods for Timestamps

#### 1. Manual JSON Input
```json
{
  "vodUrl": "https://youtube.com/watch?v=VOD_ID",
  "clips": [
    { "startTime": "0:00", "endTime": "0:30", "name": "intro" },
    { "startTime": "15:00", "endTime": "15:45", "name": "highlight-1" },
    { "startTime": "45:30", "endTime": "46:15", "name": "highlight-2" }
  ]
}
```

#### 2. CSV Import
```csv
start,end,name
0:00,0:30,intro
15:00,15:45,highlight-1
45:30,46:15,highlight-2
```

#### 3. YouTube Chapters (Auto)
```typescript
// Automatically extract all chapters as clips
const chapters = await youtubeService.getVideoInfo(vodUrl);
const clips = chapters.chapters.map(ch => ({
  startTime: formatTimestamp(ch.startTime),
  endTime: formatTimestamp(ch.endTime),
  name: ch.title
}));
```

#### 4. AI-Generated (Integration)
```typescript
// Use AI service to detect highlights, then extract
const highlights = await aiClipperService.detectHighlights(vodUrl);
const clips = highlights.map(h => ({
  startTime: h.startTime,
  endTime: h.endTime,
  name: h.reason
}));
await vodService.extractMultipleClips({ vodUrl, clips });
```

---

### Twitch VOD Support

```typescript
// Twitch VODs work similarly but need different URL handling
async function extractTwitchVodClips(vodId: string, clips: ClipInput[]): Promise<ClipResult[]> {
  // Twitch VOD URL format
  const vodUrl = `https://www.twitch.tv/videos/${vodId}`;
  
  // yt-dlp supports Twitch VODs
  // Note: May require authentication for subscriber-only VODs
  return extractMultipleClips({
    vodUrl,
    clips,
    quality: '1080'
  });
}
```

---

## Part 3: Integration Roadmap

### Phase 5: VOD Multi-Clip (Recommended Next)

```
Complexity: Medium
Value: High
Dependencies: Phase 4 (YouTube service)
```

**Tasks:**
1. Create `src/services/vod-service.ts`
2. Add VOD types to `src/types/vod.ts`
3. Create `src/api/vod.ts` routes
4. Add CSV/JSON import support
5. Implement chapter auto-extraction
6. Add progress tracking for long VODs

---

### Phase 6: AI Auto-Clipping (Future)

```
Complexity: High
Value: Very High
Dependencies: Phase 5
```

**Option A: Third-Party Integration**
1. Integrate Vizard.ai API
2. Pass detected timestamps to VOD service
3. Automatic clip extraction

**Option B: Build Custom (Advanced)**
1. Implement chat spike analyzer
2. Add audio peak detection
3. Create scoring algorithm
4. Train on historical clips

---

### Quick Win: Chapter-Based Clipping

The fastest path to "automatic" clipping without AI:

```typescript
// Many YouTube videos have chapters = free timestamps!
async function importAllChapters(videoUrl: string): Promise<ClipResult[]> {
  const info = await youtubeService.getVideoInfo(videoUrl);
  
  if (!info.chapters || info.chapters.length === 0) {
    throw new Error('Video has no chapters');
  }
  
  const clips = info.chapters.map(ch => ({
    startTime: formatTimestamp(ch.startTime),
    endTime: formatTimestamp(ch.endTime),
    name: ch.title
  }));
  
  return vodService.extractMultipleClips({
    vodUrl: videoUrl,
    clips,
    quality: '1080'
  });
}
```

This works on any YouTube video with chapters - instant "AI-like" clipping!

---

## Summary: Recommended Path

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | VOD Multi-Clip (manual timestamps) | Medium | High |
| 2 | Chapter Auto-Import | Low | Medium |
| 3 | CSV/JSON Batch Import | Low | Medium |
| 4 | Vizard.ai Integration | Medium | High |
| 5 | Custom AI (chat analysis) | High | Very High |

**Start with Phase 5 (VOD Multi-Clip)** → It enables all the others!
