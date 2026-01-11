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

| Phase | Name | Status | Key Files |
|-------|------|--------|-----------|
| 0 | Environment Setup | ✅ Complete | `.env`, `config/`, `src/config/clips-config.ts` |
| 1 | ScrapCreators Service | ✅ Complete | `src/services/scrapcreators-service.ts` |
| 2 | Google Drive Service | ✅ Complete | `src/services/drive-service.ts` |
| 3 | Twitch Workflow + API | ✅ Complete | `src/services/clip-workflow.ts`, `src/api/clips.ts` |
| 4a | YouTube Core Service | ✅ Complete | `src/services/youtube-service.ts`, `youtube-workflow.ts` |
| **4b** | **YouTube API Routes** | ⏳ **Pending** | `src/api/youtube.ts` |
| **5** | **VOD Detection & Multi-Clip** | 📋 Planned | See `PHASE-5-VOD-DETECTION.md` |
| 6 | Whop Webhooks | 📋 Future | Client/clipper management |
| 7 | Admin Dashboard | 📋 Future | Analytics, management UI |

### CLI Tools Status

| Tool | Status | Version |
|------|--------|---------|
| yt-dlp | ✅ Installed | 2025.06.09 |
| ffmpeg | ✅ Installed | 7.1.1 |

---

## Implementation Phases

### Completed Phases

| Phase | Documentation | Claude Code Prompt |
|-------|---------------|-------------------|
| 0-3 | `PHASE-0-ENV-SETUP.md` through `PHASE-3-WORKFLOW.md` | N/A (already done) |
| 4a | `PHASE-4-YOUTUBE.md` | `CLAUDE-CODE-PHASE-4.md` |

### Pending Phases

| Phase | Documentation | Claude Code Prompt |
|-------|---------------|-------------------|
| **4b** | `PHASE-4B-YOUTUBE-ROUTES.md` | See below |
| **5** | `PHASE-5-VOD-DETECTION.md` | `CLAUDE-CODE-PHASE-5.md` |

---

## API Endpoints

### Twitch Clips (✅ Working)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clips/import` | Import single Twitch clip |
| POST | `/api/clips/import/batch` | Import multiple clips (max 10) |
| POST | `/api/clips/preview` | Preview clip metadata |

### YouTube Clips (⏳ Phase 4b)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/youtube/import` | Import clip with timestamps |
| POST | `/api/youtube/import/batch` | Multiple clips from one video |
| POST | `/api/youtube/import/chapter` | Import by chapter name |
| POST | `/api/youtube/preview` | Get video metadata |
| POST | `/api/youtube/chapters` | List video chapters |
| POST | `/api/youtube/transcript` | Get video transcript |

### VOD Detection (📋 Phase 5)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vod/detect` | Detect highlights in VOD |
| POST | `/api/vod/detect/quick` | Fast detection (transcript only) |
| POST | `/api/vod/extract` | Extract multiple clips |
| POST | `/api/vod/detect-and-extract` | Full workflow |

---

## Quick Start

### Execute Phase 4b (YouTube Routes)

```bash
cd "/Users/supabowl/Library/Mobile Documents/com~apple~CloudDocs/BHT Promo iCloud/Organized AI/Windsurf/whop-clipping-agency"
claude --dangerously-skip-permissions
```

Prompt:
```
Read PLANNING/implementation-phases/PHASE-4B-YOUTUBE-ROUTES.md and execute all tasks.
```

### Execute Phase 5 (VOD Detection)

```bash
cd "/Users/supabowl/Library/Mobile Documents/com~apple~CloudDocs/BHT Promo iCloud/Organized AI/Windsurf/whop-clipping-agency"
claude --dangerously-skip-permissions
```

Prompt:
```
Read PLANNING/implementation-phases/PHASE-5-VOD-DETECTION.md and execute all tasks.
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

**Recent Commits:**
- `f167a09` - docs: Add AI clipping research and dev stream detection design
- `cdd514d` - docs: Add Phase 5 VOD detection and multi-clip planning
- `5ffc17d` - docs: Add Phase 4 YouTube planning documentation
