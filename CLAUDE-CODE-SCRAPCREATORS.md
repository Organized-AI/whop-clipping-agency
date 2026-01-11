# Claude Code - ScrapCreators → Google Drive Integration

## Quick Start

```bash
cd "/Users/supabowl/Library/Mobile Documents/com~apple~CloudDocs/BHT Promo iCloud/Organized AI/Windsurf/whop-clipping-agency"
claude --dangerously-skip-permissions
```

Then paste this prompt:

---

## Phase 0: Environment Setup

```
Read PLANNING/implementation-phases/PHASE-0-ENV-SETUP.md and execute all tasks.

Key config:
- ScrapCreators API Key: EsEkylUc02fol6qfBHP3V6uIlC73
- Google Drive Folder ID: 1SJ71RXmGln7sDI8Vs1aX-SeiDpSO09Eb
- Auth Method: Service Account

After completion, verify with:
- npm install (no errors)
- npm run typecheck (passes)

Then commit: git add -A && git commit -m "Phase 0: Environment setup complete"
```

---

## Phase 1: ScrapCreators Service

```
Read PLANNING/implementation-phases/PHASE-1-SCRAPCREATORS.md and execute all tasks.

After completion, verify with:
- npm run typecheck
- npm run test:scrapcreators

Then commit: git add -A && git commit -m "Phase 1: ScrapCreators service complete"
```

---

## Phase 2: Google Drive Service

```
Read PLANNING/implementation-phases/PHASE-2-DRIVE-SERVICE.md and execute all tasks.

IMPORTANT: Before running, ensure config/service-account.json exists with valid Google Cloud service account credentials.

After completion, verify with:
- npm run typecheck
- npm run test:drive

Then commit: git add -A && git commit -m "Phase 2: Google Drive service complete"
```

---

## Phase 3: Workflow Integration

```
Read PLANNING/implementation-phases/PHASE-3-WORKFLOW.md and execute all tasks.

After completion, verify with:
- npm run typecheck
- npm run test:workflow
- npm run dev (start server)
- npm run test:api (in separate terminal)

Then commit: git add -A && git commit -m "Phase 3: Workflow and API complete"
```

---

## Full Automation (All Phases)

```
Execute all phases sequentially:

1. Read PLANNING/implementation-phases/PHASE-0-ENV-SETUP.md and execute all tasks
2. Read PLANNING/implementation-phases/PHASE-1-SCRAPCREATORS.md and execute all tasks  
3. Read PLANNING/implementation-phases/PHASE-2-DRIVE-SERVICE.md and execute all tasks
4. Read PLANNING/implementation-phases/PHASE-3-WORKFLOW.md and execute all tasks

After each phase, run the verification commands and git commit.

Config values:
- SCRAPCREATORS_API_KEY=EsEkylUc02fol6qfBHP3V6uIlC73
- GOOGLE_DRIVE_PARENT_FOLDER=1SJ71RXmGln7sDI8Vs1aX-SeiDpSO09Eb
```

---

## Manual Step Required

Before Phase 2 can work, you must manually:

1. Go to https://console.cloud.google.com
2. Create/select a project
3. Enable Google Drive API
4. Create Service Account → Download JSON key
5. Save as `config/service-account.json`
6. Share Drive folder with service account email

See PLANNING/SCRAPCREATORS-DRIVE-MASTER-PLAN.md for detailed instructions.
