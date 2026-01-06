# Agent Handoff Document

## Project: Whop Clipping Agency

### Quick Context
Automated clipping agency management system on Whop platform. Handles client memberships, clipper recruitment, Google Drive folder provisioning, and notifications.

### Key Files to Read
1. `CLAUDE.md` - Project overview and patterns
2. `PHASED_PLAN.md` - Implementation roadmap
3. `docs/phases/` - Detailed phase instructions

### Current State
- Framework: ✅ TypeScript + Express scaffolded
- Phase 0 (Setup): ✅ Complete
- Phase 1 (Whop Products): ⏳ Ready to implement
- Phase 2-6: ⬜ Pending

### Tech Stack
- Node.js + TypeScript (strict)
- Express.js
- Whop SDK (`@whop/sdk`)
- Google Drive API (`googleapis`)
- Zod for validation

### Key Patterns
```typescript
// Whop client
import { WhopAPI } from "@whop/sdk";
const whop = new WhopAPI({ apiKey: process.env.WHOP_API_KEY });

// Drive client
import { google } from "googleapis";
const drive = google.drive({ version: "v3", auth });
```

### Next Steps
1. Run `npm install` to install dependencies
2. Copy `.env.example` to `.env` and fill in credentials
3. Execute Phase 1 using `/phase 1` command
4. Continue through phases sequentially

### Environment Variables Needed
- `WHOP_API_KEY` - Whop API key
- `WHOP_APP_ID` - Whop app ID
- `GOOGLE_*` - Google OAuth credentials
- `DATABASE_URL` - Supabase connection string

### Commands Available
- `/phase [n]` - Load and execute phase n
- `/status` - Check implementation progress
- `/commit [type] [msg]` - Create conventional commit
- `/test-webhook [event]` - Test webhook handling

### Agents Available
- `backend-dev` - TypeScript/Express patterns
- `whop-specialist` - Whop SDK and API usage
- `drive-specialist` - Google Drive integration
