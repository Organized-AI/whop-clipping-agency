# Whop Clipping Agency

## Project Overview
Automated clipping agency management system built on the Whop platform with Google Drive integration for content delivery workflows.

## Tech Stack
- **Runtime**: Node.js + TypeScript (strict mode)
- **Framework**: Express.js
- **Platform**: Whop SDK (memberships, notifications, experiences)
- **Storage**: Google Drive API (folder provisioning, sharing)
- **Clip Ingestion**: ScrapCreators API (Twitch clips)
- **Database**: Supabase/PostgreSQL
- **Validation**: Zod

## Business Model
| Tier | Price | Clips/Month | Ad Budget |
|------|-------|-------------|-----------|
| Starter | $5,000 | 30 | $2k-$5k |
| Growth | $8,000 | 60 | $5k-$15k |
| Scale | $15,000 | 120 | $15k+ |

Base: $3,000/month management + 10% ad spend

## Project Structure
```
src/
├── index.ts              # Express entry point
├── api/                  # REST API endpoints
│   ├── routes.ts
│   ├── clips.ts          # Clip import endpoints
│   └── controllers/
├── webhooks/             # Whop webhook handlers
│   ├── whop-handler.ts
│   └── events/
├── services/             # Business logic
│   ├── scrapcreators-service.ts  # Twitch clip fetching
│   ├── drive-service.ts          # Google Drive uploads
│   ├── clip-workflow.ts          # Import orchestration
│   ├── whop-setup.ts
│   ├── clipper-management.ts
│   └── notifications.ts
├── types/                # TypeScript definitions
│   └── clips.ts          # Clip-related types
├── config/               # Configuration
│   └── clips-config.ts   # ScrapCreators/Drive config
└── utils/                # Helpers
```

## Key Commands
```bash
npm run dev              # Start dev server with tsx watch
npm run build            # TypeScript compile
npm run typecheck        # Type check without emit
npm run test:scrapcreators  # Test ScrapCreators service
npm run test:drive       # Test Google Drive service
npm run test:workflow    # Test full import workflow
npm run test:api         # Test API endpoints (server must be running)
```

## Implementation Plans

### Original Platform Setup
See `PHASED_PLAN.md` for Whop platform implementation.

### ScrapCreators → Google Drive Integration
See `PLANNING/SCRAPCREATORS-DRIVE-MASTER-PLAN.md` for clip import automation.

**Quick Start:**
```bash
claude --dangerously-skip-permissions
# Then: Read CLAUDE-CODE-SCRAPCREATORS.md
```

## API Endpoints

### Clip Import
```bash
# Import single clip
POST /api/clips/import
{
  "clipUrl": "https://clips.twitch.tv/ClipSlug",
  "quality": "1080"  # optional: 1080, 720, 480, 360
}

# Batch import (up to 10)
POST /api/clips/import/batch
{
  "clips": [
    { "clipUrl": "...", "quality": "1080" },
    { "clipUrl": "...", "quality": "720" }
  ]
}

# Preview clip metadata (no download)
POST /api/clips/preview
{
  "clipUrl": "https://clips.twitch.tv/ClipSlug"
}
```

## Critical Files
- `PHASED_PLAN.md` - Whop platform implementation
- `PLANNING/SCRAPCREATORS-DRIVE-MASTER-PLAN.md` - Clip import implementation
- `CLAUDE-CODE-SCRAPCREATORS.md` - Quick-start prompts for clip system
- `.env.example` - Required environment variables
- `config/service-account.json` - Google Cloud service account (not in git)

## Environment Variables
```env
# Whop
WHOP_API_KEY=
WHOP_APP_ID=
WHOP_WEBHOOK_SECRET=

# ScrapCreators
SCRAPCREATORS_API_KEY=
SCRAPCREATORS_API_URL=https://api.scrapecreators.com/v1

# Google Drive (Service Account)
GOOGLE_DRIVE_PARENT_FOLDER=
GOOGLE_SERVICE_ACCOUNT_PATH=./config/service-account.json

# Clip Settings
DEFAULT_CLIP_QUALITY=1080
TEMP_DOWNLOAD_PATH=./temp

# Server
PORT=3000
NODE_ENV=development
```

## Service Account Setup
1. Google Cloud Console → Create Service Account
2. Download JSON key → `config/service-account.json`
3. Share target Drive folder with service account email
4. Service account email is in JSON under `client_email`

## Git Workflow
```bash
git add -A && git commit -m "feat: description"
git push origin main
```

## Byterover MCP Integration
Use `byterover-store-knowledge` when:
- Learning new patterns or APIs
- Encountering error solutions
- Finding reusable code patterns

Use `byterover-retrieve-knowledge` when:
- Starting new tasks
- Before architectural decisions
- Debugging issues
