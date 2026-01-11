# Agent Handoff Document

## Project: whop-clipping-agency

### Quick Context
Automated clip import system that takes Twitch/YouTube clips and uploads them to Google Drive with organized folder structure. Built for a Whop community clipping agency.

### Key Files to Read First
1. `CLAUDE.md` - Project overview and commands
2. `PLANNING/SCRAPCREATORS-DRIVE-MASTER-PLAN.md` - Architecture and status
3. `PLANNING/implementation-phases/` - Phase-by-phase implementation guides

### Current State

| Component | Status |
|-----------|--------|
| Environment Setup | ✅ Complete |
| ScrapCreators Service | ✅ Complete |
| Google Drive Service | ✅ Complete |
| Twitch Workflow + API | ✅ Complete |
| YouTube Core Service | ✅ Complete |
| YouTube API Routes | ⏳ Pending (Phase 4b) |
| VOD Detection | 📋 Planned (Phase 5) |

### Active Endpoints

```
POST /api/clips/import        # Twitch clip import
POST /api/clips/import/batch  # Batch Twitch import
POST /api/clips/preview       # Preview Twitch clip
```

### Next Steps

1. **Phase 4b**: Create `src/api/youtube.ts` routes
2. **Phase 5**: Implement VOD highlight detection

### Project Structure

```
src/
├── api/
│   └── clips.ts              # Twitch routes (working)
├── services/
│   ├── scrapcreators-service.ts
│   ├── drive-service.ts
│   ├── clip-workflow.ts      # Twitch workflow
│   ├── youtube-service.ts    # YouTube download
│   └── youtube-workflow.ts   # YouTube workflow
├── types/
│   ├── clips.ts
│   └── youtube.ts
└── index.ts                  # Express app

PLANNING/
├── implementation-phases/    # Current phase docs
├── AI-CLIPPING-VOD-RESEARCH.md
├── DEV-STREAM-HIGHLIGHT-DETECTION.md
└── SCRAPCREATORS-DRIVE-MASTER-PLAN.md

.archive/
└── legacy-whop-agency-phases/  # Old agency management phases
```

### CLI Tools Required
- `yt-dlp` (installed: 2025.06.09)
- `ffmpeg` (installed: 7.1.1)

### Quick Commands

```bash
# Start dev server
npm run dev

# Test Twitch import
npm run test:workflow

# Test YouTube service
npm run test:youtube

# Import YouTube clip
npm run import:youtube "URL" "1:00" "2:00"
```
