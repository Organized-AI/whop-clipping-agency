# Whop Clipping Agency

## Project Overview
Automated clipping agency management system built on the Whop platform with Google Drive integration for content delivery workflows.

## Tech Stack
- **Runtime**: Node.js + TypeScript (strict mode)
- **Framework**: Express.js
- **Platform**: Whop SDK (memberships, notifications, experiences)
- **Storage**: Google Drive API (folder provisioning, sharing)
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
│   └── controllers/
├── webhooks/             # Whop webhook handlers
│   ├── whop-handler.ts
│   └── events/
├── services/             # Business logic
│   ├── whop-setup.ts
│   ├── clipper-management.ts
│   ├── drive-service.ts
│   └── notifications.ts
├── types/                # TypeScript definitions
├── config/               # Configuration
└── utils/                # Helpers
```

## Key Commands
```bash
npm run dev          # Start dev server with tsx watch
npm run build        # TypeScript compile
npm run typecheck    # Type check without emit
npm run setup        # Run Whop product setup script
```

## Implementation Phases
See `PHASED_PLAN.md` for full implementation guide.

| Phase | Focus | Files |
|-------|-------|-------|
| 0 | Project Setup | package.json, tsconfig.json |
| 1 | Whop Products | src/services/whop-setup.ts |
| 2 | Webhooks | src/webhooks/ |
| 3 | Clipper System | src/services/clipper-management.ts |
| 4 | Drive Integration | src/services/drive-service.ts |
| 5 | Admin API | src/api/ |
| 6 | Notifications | src/services/notifications.ts |

## Critical Files
- `PHASED_PLAN.md` - Master implementation guide
- `docs/phases/` - Claude Code prompts for each phase
- `.env.example` - Required environment variables
- `src/index.ts` - Application entry point

## Whop API Patterns
```typescript
import { WhopAPI } from "@whop/sdk";
const whop = new WhopAPI({ apiKey: process.env.WHOP_API_KEY });

// List memberships
const memberships = await whop.memberships.list({ status: "active" });

// Send notification
await whop.notifications.create({ user_id, title, body });
```

## Google Drive Patterns
```typescript
import { google } from "googleapis";
const drive = google.drive({ version: "v3", auth });

// Create folder
await drive.files.create({
  requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents },
});

// Share folder
await drive.permissions.create({
  fileId, requestBody: { type: "user", role: "writer", emailAddress },
});
```

## Development Notes
- Always use Zod for request validation
- Webhook signature verification is critical
- Queue long-running tasks (folder creation, notifications)
- Log all Whop events for debugging

## Git Workflow
```bash
git add -A && git commit -m "feat: description"
git push origin main
```

## Environment Setup
Copy `.env.example` to `.env` and fill in:
- `WHOP_API_KEY` - From Whop developer dashboard
- `WHOP_APP_ID` - Your Whop app ID
- `GOOGLE_*` - Google Cloud OAuth credentials
