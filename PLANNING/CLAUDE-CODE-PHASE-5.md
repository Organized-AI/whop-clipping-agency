# Phase 5: VOD Detection & Multi-Clip - Claude Code Prompt

## Quick Execute

```bash
cd "/Users/supabowl/Library/Mobile Documents/com~apple~CloudDocs/BHT Promo iCloud/Organized AI/Windsurf/whop-clipping-agency"
claude --dangerously-skip-permissions
```

---

## Full Phase Execution

Paste this prompt:

```
Read PLANNING/implementation-phases/PHASE-5-VOD-DETECTION.md and execute all tasks in order.

This phase implements:
1. Highlight detection types and teaching pattern config
2. Transcript analyzer (detects explanations via phrase matching)
3. Motion analyzer (detects active coding via FFmpeg scene detection)
4. Signal fusion (combines transcript + motion for best clips)
5. VOD service (download-once, split-many extraction)
6. API routes for detection and extraction

Create all files in order, run typecheck after each major component.
```

---

## Incremental Execution

### Step 1: Types and Config
```
Read PHASE-5-VOD-DETECTION.md and execute Tasks 1-2 only:
- Create src/types/highlights.ts
- Create src/config/teaching-patterns.ts
Run npm run typecheck to verify.
```

### Step 2: Transcript Analyzer
```
Read PHASE-5-VOD-DETECTION.md and execute Task 3:
- Create src/services/highlight-detection/transcript-analyzer.ts
This analyzes video transcripts for teaching patterns.
Run npm run typecheck to verify.
```

### Step 3: Motion Analyzer
```
Read PHASE-5-VOD-DETECTION.md and execute Task 4:
- Create src/services/highlight-detection/motion-analyzer.ts
This uses FFmpeg to detect screen activity.
Run npm run typecheck to verify.
```

### Step 4: Signal Fusion
```
Read PHASE-5-VOD-DETECTION.md and execute Task 5:
- Create src/services/highlight-detection/signal-fusion.ts
This combines transcript and motion signals.
Run npm run typecheck to verify.
```

### Step 5: Main Detection Service
```
Read PHASE-5-VOD-DETECTION.md and execute Task 6:
- Create src/services/highlight-detection/index.ts
This is the main entry point for highlight detection.
Run npm run typecheck to verify.
```

### Step 6: VOD Service
```
Read PHASE-5-VOD-DETECTION.md and execute Task 7:
- Create src/services/vod-service.ts
This implements download-once, split-many extraction.
Run npm run typecheck to verify.
```

### Step 7: API Routes
```
Read PHASE-5-VOD-DETECTION.md and execute Tasks 8-9:
- Create src/api/vod.ts
- Update src/index.ts to include VOD routes
Run npm run typecheck to verify.
```

### Step 8: Test Scripts
```
Read PHASE-5-VOD-DETECTION.md and execute Task 10:
- Create scripts/test-detection.ts
- Create scripts/test-vod-extract.ts
Add npm scripts for testing.
```

---

## Verification Checklist

After completion:
- [ ] `npm run typecheck` passes
- [ ] `src/services/highlight-detection/` has 4 files
- [ ] `src/services/vod-service.ts` exists
- [ ] `src/api/vod.ts` exists
- [ ] Server starts with `npm run dev`

---

## Test Commands

```bash
# Test highlight detection
npm run test:detection "https://youtube.com/watch?v=YOUR_VOD_ID"

# Test VOD extraction
npm run test:vod-extract "https://youtube.com/watch?v=YOUR_VOD_ID"

# Test via API (server must be running)
curl -X POST http://localhost:3000/api/vod/detect \
  -H "Content-Type: application/json" \
  -d '{
    "vodUrl": "https://youtube.com/watch?v=YOUR_VOD_ID",
    "options": { "maxClips": 5 }
  }'

# Full detect + extract workflow
curl -X POST http://localhost:3000/api/vod/detect-and-extract \
  -H "Content-Type: application/json" \
  -d '{
    "vodUrl": "https://youtube.com/watch?v=YOUR_VOD_ID",
    "maxClips": 5,
    "quality": "1080"
  }'
```

---

## Expected File Structure After Phase 5

```
src/
├── api/
│   ├── clips.ts          # Twitch clips (Phase 3)
│   ├── youtube.ts        # YouTube clips (Phase 4)
│   └── vod.ts            # VOD detection & extraction (NEW)
├── config/
│   ├── clips-config.ts
│   └── teaching-patterns.ts  # (NEW)
├── services/
│   ├── scrapcreators-service.ts
│   ├── drive-service.ts
│   ├── clip-workflow.ts
│   ├── youtube-service.ts
│   ├── youtube-workflow.ts
│   ├── vod-service.ts        # (NEW)
│   └── highlight-detection/  # (NEW)
│       ├── index.ts
│       ├── transcript-analyzer.ts
│       ├── motion-analyzer.ts
│       └── signal-fusion.ts
├── types/
│   ├── clips.ts
│   ├── youtube.ts
│   └── highlights.ts         # (NEW)
└── index.ts

scripts/
├── test-detection.ts         # (NEW)
└── test-vod-extract.ts       # (NEW)
```

---

## Customization Reminder

After implementation, customize `src/config/teaching-patterns.ts` with your personal phrases!

```typescript
// Add your common teaching phrases
highConfidence: [
  "so what we're gonna do",
  "here's the play",
  "check this out",
  // ... your phrases
],

// Add your reaction phrases
realizationMoments: [
  "boom",
  "let's go",
  "there it is",
  // ... your phrases
]
```
