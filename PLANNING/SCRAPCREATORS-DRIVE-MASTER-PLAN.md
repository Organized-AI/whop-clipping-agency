# Clip Import System - Master Plan

**Created:** January 11, 2026  
**Updated:** January 11, 2026  
**Project Path:** `/Users/supabowl/Library/Mobile Documents/com~apple~CloudDocs/BHT Promo iCloud/Organized AI/Windsurf/whop-clipping-agency`  
**Runtime:** Node.js + TypeScript  
**Target:** Automated clip import (Twitch + YouTube) to Google Drive for Whop community

---

## Architecture Overview

### Twitch Pipeline (Phases 0-3) ✅
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Twitch Clip    │────▶│  ScrapCreators   │────▶│  Download MP4   │
│  URL/Slug       │     │  API             │     │  (temp storage) │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Shareable      │◀────│  Google Drive    │◀────│  Upload to      │
│  Link           │     │  (date folder)   │     │  Drive API      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### YouTube Pipeline (Phase 4) ✅
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  YouTube URL    │────▶│  yt-dlp          │────▶│  Download MP4   │
│  + Timestamps   │     │  + ffmpeg        │     │  (temp storage) │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Shareable      │◀────│  Google Drive    │◀────│  Upload to      │
│  Link           │     │  (date folder)   │     │  Drive API      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Dev Stream Detection Pipeline (Phase 5) 📋
```
┌──────────────────────────────────────────────────────────────────┐
│                 Dev Stream Highlight Detection                    │
└──────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   TRANSCRIPT    │  │     MOTION      │  │     AUDIO       │
│   ANALYZER      │  │    ANALYZER     │  │   (Future)      │
│                 │  │                 │  │                 │
│ • Teaching      │  │ • Scene changes │  │ • Speech ratio  │
│   phrases       │  │ • Frame diffs   │  │ • Silence→spike │
│ • Realizations  │  │ • Activity      │  │                 │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                 ┌─────────────────────────┐
                 │     SIGNAL FUSION       │
                 │ → Ranked Highlights     │
                 └────────────┬────────────┘
                              ▼
                 ┌─────────────────────────┐
                 │   DOWNLOAD ONCE,        │
                 │   SPLIT MANY            │
                 │ → Multiple clips        │
                 └─────────────────────────┘
```

---

## Current Status

| Phase | Name | Status | Files |
|-------|------|--------|-------|
| 0 | Environment Setup | ✅ Complete | `.env`, `config/service-account.json` |
| 1 | ScrapCreators Service | ✅ Complete | `src/services/scrapcreators-service.ts` |
| 2 | Google Drive Service | ✅ Complete | `src/services/drive-service.ts` |
| 3 | Twitch Workflow | ✅ Complete | `src/services/clip-workflow.ts`, `src/api/clips.ts` |
| 4a | YouTube Core Service | ✅ Complete | `src/services/youtube-service.ts`, `youtube-workflow.ts` |
| 4b | YouTube API Routes | ⏳ Pending | `src/api/youtube.ts` |
| 5 | VOD Detection & Multi-Clip | 📋 Planned | See `PHASE-5-VOD-DETECTION.md` |
| 6 | AI Auto-Clipping | 📋 Future | Vizard.ai or custom |

---

## Phase 5: Dev Stream Detection

Specifically designed for **software development live streams**:

### Detection Signals

| Signal | What It Catches | Method |
|--------|----------------|--------|
| **Teaching phrases** | "so what we're doing here is...", explanations | Transcript keyword matching |
| **Realization moments** | "oh that's why!", "boom", "found it" | Phrase detection (+4 score) |
| **Terminal activity** | npm install, builds, test output | FFmpeg scene detection |
| **Code scrolling** | Active coding, navigation | Frame difference analysis |

### Clip Types

| Type | Description | Detection |
|------|-------------|-----------|
| `explanation` | Teaching a concept | High transcript, low motion |
| `build_moment` | Terminal output, builds | Low transcript, high motion |
| `demo` | Explaining while coding | Both signals present |
| `aha_moment` | Discovery/realization | Realization phrase detected |

### API Endpoints (Phase 5)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vod/detect` | Detect highlights in VOD |
| POST | `/api/vod/detect/quick` | Fast detection (transcript only) |
| POST | `/api/vod/extract` | Extract multiple clips |
| POST | `/api/vod/detect-and-extract` | Full workflow |

---

## Configuration

### ScrapCreators API
- **Endpoint:** `https://api.scrapecreators.com/v1`
- **Supports:** Twitch clips, YouTube metadata/transcripts

### Google Drive
- **Auth Method:** Service Account
- **Service Account:** `clip-drive-uploader@whop-clipping-agency.iam.gserviceaccount.com`
- **Parent Folder ID:** `1SJ71RXmGln7sDI8Vs1aX-SeiDpSO09Eb`
- **Folder Structure:** Date-based subfolders (`YYYY-MM-DD`)

### External Tools
- **yt-dlp:** YouTube/Twitch video downloading
- **ffmpeg:** Video processing, scene detection, splitting

---

## Implementation Phases

| Phase | Name | Dependencies | Documentation |
|-------|------|--------------|---------------|
| 0 | Environment Setup | None | `PHASE-0-ENV-SETUP.md` |
| 1 | ScrapCreators Service | Phase 0 | `PHASE-1-SCRAPCREATORS.md` |
| 2 | Google Drive Service | Phase 0 | `PHASE-2-DRIVE-SERVICE.md` |
| 3 | Twitch Workflow | Phases 1 & 2 | `PHASE-3-WORKFLOW.md` |
| 4 | YouTube Service | Phases 0 & 2 | `PHASE-4-YOUTUBE.md` |
| **5** | **VOD Detection & Multi-Clip** | Phase 4 | `PHASE-5-VOD-DETECTION.md` |
| 6 | AI Auto-Clipping (External) | Phase 5 | *Research complete* |

---

## Quick Start

### CLI Usage

```bash
cd "/Users/supabowl/Library/Mobile Documents/com~apple~CloudDocs/BHT Promo iCloud/Organized AI/Windsurf/whop-clipping-agency"

# Import Twitch clip
npm run test:workflow

# Import YouTube clip
npx tsx scripts/import-youtube-clip.ts "https://youtube.com/watch?v=VIDEO_ID" "1:30" "2:45"

# Detect highlights (Phase 5)
npm run test:detection "https://youtube.com/watch?v=VOD_ID"

# Extract multiple clips (Phase 5)
npm run test:vod-extract "https://youtube.com/watch?v=VOD_ID"
```

### API Usage

```bash
# Start server
npm run dev

# Detect + Extract (Phase 5 full workflow)
curl -X POST http://localhost:3000/api/vod/detect-and-extract \
  -H "Content-Type: application/json" \
  -d '{
    "vodUrl": "https://youtube.com/watch?v=VOD_ID",
    "maxClips": 5,
    "quality": "1080"
  }'
```

---

## Claude Code Execution

```bash
cd "/Users/supabowl/Library/Mobile Documents/com~apple~CloudDocs/BHT Promo iCloud/Organized AI/Windsurf/whop-clipping-agency"
claude --dangerously-skip-permissions

# Execute phases
"Read PLANNING/implementation-phases/PHASE-5-VOD-DETECTION.md and execute all tasks"
```

---

## Research Documents

| Document | Purpose |
|----------|---------|
| `PLANNING/AI-CLIPPING-VOD-RESEARCH.md` | AI clipping services comparison |
| `PLANNING/DEV-STREAM-HIGHLIGHT-DETECTION.md` | Custom detection system design |

---

## Repository

**GitHub:** https://github.com/Organized-AI/whop-clipping-agency

**Key Commits:**
- `5ffc17d` - Phase 4 planning documentation
- `3ff0516` - Phase 4: YouTube clip service with yt-dlp
- `15c33e6` - Claude Code marketplace components
- `896c941` - Phase planning documentation
