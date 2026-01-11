---
name: pre-task-context
description: Automatically loads relevant context before starting tasks
trigger: task_start
---

# Pre-Task Context Hook

Automatically loads project context before starting implementation tasks.

## Trigger
Runs at the start of any implementation task.

## Actions

### 1. Load Project Overview
Always read these files first:
- `CLAUDE.md` - Project overview and patterns
- `PLANNING/SCRAPCREATORS-DRIVE-MASTER-PLAN.md` - Architecture

### 2. Identify Current Phase
Check for completion files:
```bash
ls PLANNING/implementation-phases/PHASE-*-COMPLETE.md 2>/dev/null | tail -1
```

### 3. Load Phase-Specific Context
Based on current phase, read:

**Phase 0 (Setup)**
- `PLANNING/implementation-phases/PHASE-0-ENV-SETUP.md`
- `.env.example`

**Phase 1 (ScrapCreators)**
- `PLANNING/implementation-phases/PHASE-1-SCRAPCREATORS.md`
- `.claude/agents/scrapcreators-specialist.md`

**Phase 2 (Drive)**
- `PLANNING/implementation-phases/PHASE-2-DRIVE-SERVICE.md`
- `.claude/agents/drive-specialist.md`

**Phase 3 (Workflow)**
- `PLANNING/implementation-phases/PHASE-3-WORKFLOW.md`
- `.claude/agents/clip-workflow.md`

### 4. Load Existing Code
If modifying existing files, read them first:
```bash
# Check what's been built
ls -la src/services/ 2>/dev/null
ls -la src/types/ 2>/dev/null
ls -la src/api/ 2>/dev/null
```

### 5. Environment Check
Verify environment is ready:
```bash
# Check .env exists
test -f .env && echo "✅ .env exists" || echo "⚠️ .env missing"

# Check service account
test -f config/service-account.json && echo "✅ Service account ready" || echo "⚠️ Service account missing"

# Check dependencies
test -d node_modules && echo "✅ Dependencies installed" || echo "⚠️ Run npm install"
```

## Context Loading Order
1. CLAUDE.md (always)
2. Master plan (always)
3. Current phase prompt
4. Relevant agent files
5. Existing source files
6. Environment verification
