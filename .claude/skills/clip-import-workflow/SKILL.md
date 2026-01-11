---
name: clip-import-workflow
description: Complete workflow for importing Twitch clips via ScrapCreators API to Google Drive with date-based organization.
triggers:
  - "import clip"
  - "twitch to drive"
  - "scrapcreators"
  - "clip workflow"
  - "upload twitch clip"
---

# Clip Import Workflow Skill

## Overview
End-to-end automation for importing Twitch clips to Google Drive using ScrapCreators API.

## Architecture
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Twitch URL   │────▶│ ScrapCreators│────▶│ Download MP4 │
└──────────────┘     │ API          │     │ (temp)       │
                     └──────────────┘     └──────┬───────┘
                                                 │
┌──────────────┐     ┌──────────────┐     ┌──────▼───────┐
│ Shareable    │◀────│ Google Drive │◀────│ Upload       │
│ Link         │     │ (date folder)│     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Configuration

### Environment Variables
```env
SCRAPCREATORS_API_KEY=EsEkylUc02fol6qfBHP3V6uIlC73
SCRAPCREATORS_API_URL=https://api.scrapecreators.com/v1
GOOGLE_DRIVE_PARENT_FOLDER=1SJ71RXmGln7sDI8Vs1aX-SeiDpSO09Eb
GOOGLE_SERVICE_ACCOUNT_PATH=./config/service-account.json
DEFAULT_CLIP_QUALITY=1080
TEMP_DOWNLOAD_PATH=./temp
```

### Service Account
File: `config/service-account.json`
Email: `clip-drive-uploader@whop-clipping-agency.iam.gserviceaccount.com`

## File Structure
```
src/
├── config/
│   └── clips-config.ts       # Configuration loader
├── types/
│   └── clips.ts              # Type definitions
├── services/
│   ├── scrapcreators-service.ts  # API + download
│   ├── drive-service.ts          # Upload + folders
│   └── clip-workflow.ts          # Orchestration
└── api/
    └── clips.ts              # REST endpoints
```

## API Endpoints

### Import Single Clip
```bash
POST /api/clips/import
Content-Type: application/json

{
  "clipUrl": "https://clips.twitch.tv/SlugName",
  "quality": "1080"
}
```

### Batch Import
```bash
POST /api/clips/import/batch
Content-Type: application/json

{
  "clips": [
    { "clipUrl": "...", "quality": "1080" },
    { "clipUrl": "...", "quality": "720" }
  ]
}
```

### Preview (No Download)
```bash
POST /api/clips/preview
Content-Type: application/json

{
  "clipUrl": "https://clips.twitch.tv/SlugName"
}
```

## Response Format
```json
{
  "success": true,
  "data": {
    "clipId": "SlugName",
    "title": "Clip Title",
    "duration": 46,
    "broadcaster": "streamer_name",
    "driveFileId": "1abc123xyz",
    "driveUrl": "https://drive.google.com/file/d/1abc123xyz/view",
    "folder": "2026-01-11"
  }
}
```

## Testing
```bash
# Test ScrapCreators service
npm run test:scrapcreators

# Test Google Drive service
npm run test:drive

# Test full workflow
npm run test:workflow

# Test API (server must be running)
npm run dev  # Terminal 1
npm run test:api  # Terminal 2
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Invalid slug | Bad URL format | Use clips.twitch.tv/SLUG format |
| API 401 | Bad API key | Verify SCRAPCREATORS_API_KEY |
| Drive 403 | No access | Share folder with service account |
| Download fail | Token expired | Re-fetch from ScrapCreators |

## Quality Options
- `1080` - Full HD (default)
- `720` - HD
- `480` - SD
- `360` - Low
