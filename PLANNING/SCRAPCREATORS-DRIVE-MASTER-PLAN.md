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

---

## Current Status

| Phase | Name | Status | Files |
|-------|------|--------|-------|
| 0 | Environment Setup | ✅ Complete | `.env`, `config/service-account.json` |
| 1 | ScrapCreators Service | ✅ Complete | `src/services/scrapcreators-service.ts` |
| 2 | Google Drive Service | ✅ Complete | `src/services/drive-service.ts` |
| 3 | Twitch Workflow | ✅ Complete | `src/services/clip-workflow.ts`, `src/api/clips.ts` |
| 4 | YouTube Service | ✅ Core Complete | `src/services/youtube-service.ts`, `src/services/youtube-workflow.ts` |
| 4b | YouTube API Routes | ⏳ Pending | `src/api/youtube.ts` |

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
- **yt-dlp:** YouTube video downloading
- **ffmpeg:** Video processing/trimming

---

## Implementation Phases

| Phase | Name | Dependencies | Documentation |
|-------|------|--------------|---------------|
| 0 | Environment Setup | None | `PHASE-0-ENV-SETUP.md` |
| 1 | ScrapCreators Service | Phase 0 | `PHASE-1-SCRAPCREATORS.md` |
| 2 | Google Drive Service | Phase 0 | `PHASE-2-DRIVE-SERVICE.md` |
| 3 | Twitch Workflow | Phases 1 & 2 | `PHASE-3-WORKFLOW.md` |
| 4 | YouTube Service | Phases 0 & 2 | `PHASE-4-YOUTUBE.md` |
| 5 | VOD Multi-Clip | Phase 4 | *Planned* |
| 6 | AI Auto-Clipping | Phases 4 & 5 | *Planned* |

---

## API Endpoints

### Twitch Clips
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clips/import` | Import single Twitch clip |
| POST | `/api/clips/import/batch` | Import multiple clips (max 10) |
| POST | `/api/clips/preview` | Preview clip metadata |

### YouTube Clips
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/youtube/import` | Import clip with timestamps |
| POST | `/api/youtube/import/batch` | Multiple clips from one video |
| POST | `/api/youtube/import/chapter` | Import by chapter name |
| POST | `/api/youtube/preview` | Get video metadata |
| POST | `/api/youtube/chapters` | List video chapters |
| POST | `/api/youtube/transcript` | Get video transcript |

---

## Quick Start

### CLI Usage

```bash
cd "/Users/supabowl/Library/Mobile Documents/com~apple~CloudDocs/BHT Promo iCloud/Organized AI/Windsurf/whop-clipping-agency"

# Import Twitch clip
npm run test:workflow

# Import YouTube clip
npx tsx scripts/import-youtube-clip.ts "https://youtube.com/watch?v=VIDEO_ID" "1:30" "2:45"

# Run tests
npm run test:youtube
npm run test:drive
```

### API Usage

```bash
# Start server
npm run dev

# Import Twitch clip
curl -X POST http://localhost:3000/api/clips/import \
  -H "Content-Type: application/json" \
  -d '{"clipUrl": "https://clips.twitch.tv/SLUG"}'

# Import YouTube clip
curl -X POST http://localhost:3000/api/youtube/import \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://youtube.com/watch?v=ID", "startTime": "1:30", "endTime": "2:45"}'
```

---

## Claude Code Execution

```bash
# Navigate to project
cd "/Users/supabowl/Library/Mobile Documents/com~apple~CloudDocs/BHT Promo iCloud/Organized AI/Windsurf/whop-clipping-agency"

# Start Claude Code
claude --dangerously-skip-permissions

# Execute phases
/phase clip-0   # Environment setup
/phase clip-1   # ScrapCreators service
/phase clip-2   # Drive service
/phase clip-3   # Twitch workflow
/phase clip-4   # YouTube service
```

---

## Future Phases

### Phase 5: VOD Multi-Clip Extraction
- Download Twitch/YouTube VODs
- Split into multiple clips by timestamp list
- Batch upload to organized folders

### Phase 6: AI Auto-Clipping
- Integration options:
  - StreamLadder ClipGPT API
  - Eklipse API
  - Custom ML model (chat spike analysis)
- Automatic highlight detection
- One-click viral moment extraction

### Phase 7: Whop Webhook Triggers
- Clip import on membership purchase
- Automated onboarding with Drive folder
- Usage tracking per subscriber

---

## Repository

**GitHub:** https://github.com/Organized-AI/whop-clipping-agency

**Key Commits:**
- `3ff0516` - Phase 4: YouTube clip service with yt-dlp
- `15c33e6` - Claude Code marketplace components
- `896c941` - Phase planning documentation
