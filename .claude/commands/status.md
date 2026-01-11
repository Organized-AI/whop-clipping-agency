---
name: status
description: Check project implementation status across all phases
---

# Command: /status

## Purpose
Display current implementation status for both Whop platform and clip import workflows.

## Usage
```
/status
```

## Behavior
1. Check which files exist in `src/`
2. Look for phase completion markers
3. Verify environment configuration
4. Display status for both workflows

## Status Checks

### Whop Platform Phases

#### Phase 0: Setup
- [ ] `package.json` exists
- [ ] `tsconfig.json` configured
- [ ] `node_modules/` installed

#### Phase 1: Whop Products
- [ ] `src/services/whop-setup.ts` exists
- [ ] `src/types/whop.ts` exists
- [ ] `src/config/products.ts` exists

#### Phase 2: Webhooks
- [ ] `src/webhooks/whop-handler.ts` exists
- [ ] `src/webhooks/events/membership.ts` exists

#### Phase 3: Clippers
- [ ] `src/services/clipper-management.ts` exists
- [ ] `src/api/clippers.ts` exists

#### Phase 4-6: Drive, Admin API, Notifications
- [ ] See original PHASED_PLAN.md

---

### Clip Import Phases

#### Clip Phase 0: Environment Setup
- [ ] `.env` exists with SCRAPCREATORS_API_KEY
- [ ] `.env` exists with GOOGLE_DRIVE_PARENT_FOLDER
- [ ] `config/service-account.json` exists
- [ ] `src/config/clips-config.ts` exists
- [ ] `temp/` directory exists

#### Clip Phase 1: ScrapCreators Service
- [ ] `src/types/clips.ts` exists
- [ ] `src/services/scrapcreators-service.ts` exists
- [ ] `npm run test:scrapcreators` passes

#### Clip Phase 2: Google Drive Service
- [ ] `src/services/drive-service.ts` exists
- [ ] `npm run test:drive` passes
- [ ] Drive folder shared with service account

#### Clip Phase 3: Workflow Integration
- [ ] `src/services/clip-workflow.ts` exists
- [ ] `src/api/clips.ts` exists
- [ ] `npm run test:workflow` passes
- [ ] API endpoints responding

---

## Check Commands

```bash
# Quick file check
ls -la src/services/ src/types/ src/api/ src/config/ 2>/dev/null

# Check for completion files
ls PLANNING/implementation-phases/PHASE-*-COMPLETE.md 2>/dev/null

# Environment check
test -f .env && echo "✅ .env" || echo "❌ .env missing"
test -f config/service-account.json && echo "✅ Service account" || echo "❌ Service account missing"

# Test suites
npm run typecheck
npm run test:scrapcreators 2>/dev/null || echo "ScrapCreators service not ready"
npm run test:drive 2>/dev/null || echo "Drive service not ready"
```

## Output Format
```
📊 Project Status
==================

🔷 WHOP PLATFORM
Phase 0: Setup           ✅ Complete
Phase 1: Whop Products   ⬜ Not Started
Phase 2: Webhooks        ⬜ Not Started
Phase 3: Clippers        ⬜ Not Started
Phase 4: Drive           ⬜ Not Started
Phase 5: Admin API       ⬜ Not Started
Phase 6: Notifications   ⬜ Not Started

🎬 CLIP IMPORT
Phase 0: Env Setup       ⏳ In Progress
Phase 1: ScrapCreators   ⬜ Not Started
Phase 2: Drive Service   ⬜ Not Started
Phase 3: Workflow        ⬜ Not Started

📋 Environment
.env file:              ✅ Ready
Service account:        ✅ Ready
Dependencies:           ✅ Installed
TypeScript:             ✅ Passes

Next: Complete Clip Phase 0
Command: /phase clip-0
```
