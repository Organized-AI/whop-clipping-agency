# ScrapCreators → Google Drive Integration - Master Plan

**Created:** January 11, 2026  
**Project Path:** `/Users/supabowl/Library/Mobile Documents/com~apple~CloudDocs/BHT Promo iCloud/Organized AI/Windsurf/whop-clipping-agency`  
**Runtime:** Node.js + TypeScript  
**Target:** Automated Twitch clip import to Google Drive for Whop community

---

## Architecture Overview

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

---

## Configuration

### ScrapCreators API
- **Endpoint:** `https://api.scrapecreators.com/v1/twitch/clip`
- **API Key:** `EsEkylUc02fol6qfBHP3V6uIlC73`
- **Credits Remaining:** 92

### Google Drive
- **Auth Method:** Service Account
- **Parent Folder ID:** `1SJ71RXmGln7sDI8Vs1aX-SeiDpSO09Eb`
- **Folder Structure:** Date-based subfolders (`YYYY-MM-DD`)
- **Sharing:** Folder pre-shared with Whop community (no additional permissions needed)

---

## Pre-Implementation Checklist

### ✅ Planning (Complete)
| Component | Location | Status |
|-----------|----------|--------|
| Master Plan | `PLANNING/SCRAPCREATORS-DRIVE-MASTER-PLAN.md` | ✅ |
| Phase Prompts | `PLANNING/implementation-phases/` | ✅ |
| Type Definitions | `src/types/clips.ts` | ⏳ |

### ⏳ Services (To Build)
| Component | Location | Status |
|-----------|----------|--------|
| ScrapCreators Service | `src/services/scrapcreators-service.ts` | ⏳ |
| Drive Service | `src/services/drive-service.ts` | ⏳ |
| Clip Workflow | `src/services/clip-workflow.ts` | ⏳ |
| Clips API Route | `src/api/clips.ts` | ⏳ |

### ⏳ Configuration (To Set Up)
| Component | Location | Status |
|-----------|----------|--------|
| Environment Variables | `.env` | ⏳ |
| Service Account Key | `config/service-account.json` | ⏳ |

---

## Implementation Phases

| Phase | Name | Files Created | Dependencies |
|-------|------|---------------|--------------|
| 0 | Environment Setup | `.env`, `package.json` updates, service account | None |
| 1 | ScrapCreators Service | `src/services/scrapcreators-service.ts`, `src/types/clips.ts` | Phase 0 |
| 2 | Google Drive Service | `src/services/drive-service.ts` | Phase 0 |
| 3 | Workflow Integration | `src/services/clip-workflow.ts`, `src/api/clips.ts` | Phases 1 & 2 |

---

## Service Account Setup (Manual Step)

Before running Phase 0, you need to create a Google Cloud Service Account:

1. **Go to Google Cloud Console:** https://console.cloud.google.com
2. **Create or select a project**
3. **Enable Google Drive API:**
   - APIs & Services → Enable APIs → Search "Google Drive API" → Enable
4. **Create Service Account:**
   - APIs & Services → Credentials → Create Credentials → Service Account
   - Name: `whop-clipping-drive`
   - Role: None (we'll share folder directly)
5. **Generate Key:**
   - Click service account → Keys → Add Key → Create new key → JSON
   - Save as `config/service-account.json`
6. **Share Folder:**
   - Copy service account email (e.g., `whop-clipping-drive@project.iam.gserviceaccount.com`)
   - In Google Drive, right-click target folder → Share → Add the service account email as Editor

---

## API Reference

### Import Clip Endpoint

```
POST /api/clips/import
```

**Request Body:**
```json
{
  "clipUrl": "https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4",
  "quality": "1080"  // optional: "1080", "720", "480", "360"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clipId": "SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4",
    "title": "Creative Suite Hack",
    "duration": 46,
    "broadcaster": "jordaaanhill",
    "driveFileId": "1abc123xyz",
    "driveUrl": "https://drive.google.com/file/d/1abc123xyz/view",
    "folder": "2026-01-11"
  }
}
```

---

## Execution Order

```bash
# Terminal 1: Navigate to project
cd "/Users/supabowl/Library/Mobile Documents/com~apple~CloudDocs/BHT Promo iCloud/Organized AI/Windsurf/whop-clipping-agency"

# Terminal 2: Start Claude Code
claude --dangerously-skip-permissions

# Execute phases sequentially
"Read PLANNING/implementation-phases/PHASE-0-ENV-SETUP.md and execute all tasks"
# After Phase 0 complete:
"Read PLANNING/implementation-phases/PHASE-1-SCRAPCREATORS.md and execute all tasks"
# After Phase 1 complete:
"Read PLANNING/implementation-phases/PHASE-2-DRIVE-SERVICE.md and execute all tasks"
# After Phase 2 complete:
"Read PLANNING/implementation-phases/PHASE-3-WORKFLOW.md and execute all tasks"
```

---

## Phase Completion Template

After each phase, create `PHASE-X-COMPLETE.md`:

```markdown
# Phase X: [NAME] - COMPLETE

**Completed:** [DATE]

## Deliverables
- [x] [File 1]
- [x] [File 2]

## Verification
- `npm run typecheck`: ✅/❌
- `npm run build`: ✅/❌
- Manual test: ✅/❌

## Notes
[Any issues or changes]

## Next
Proceed to Phase [X+1]
```

Then commit:
```bash
git add -A && git commit -m "Phase X: [NAME] complete"
```
