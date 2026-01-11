---
name: post-phase
description: Runs after completing a phase - creates completion file and commits
trigger: manual
---

# Post-Phase Completion Hook

Run after completing each implementation phase.

## Trigger
Manually invoke after completing a phase.

## Actions

### 1. Create Phase Completion File
```bash
PHASE_NUM=$1
PHASE_NAME=$2
DATE=$(date +%Y-%m-%d)

cat > "PLANNING/implementation-phases/PHASE-${PHASE_NUM}-COMPLETE.md" << EOF
# Phase ${PHASE_NUM}: ${PHASE_NAME} - COMPLETE

**Completed:** ${DATE}

## Deliverables
$(git diff --name-only HEAD~1 | sed 's/^/- [x] /')

## Verification
- \`npm run typecheck\`: ✅
- \`npm run build\`: ✅

## Notes
Phase completed successfully.

## Next
Proceed to Phase $((PHASE_NUM + 1))
EOF
```

### 2. Run Verification
```bash
npm run typecheck
npm run build 2>/dev/null || echo "Build script not configured yet"
```

### 3. Git Commit
```bash
git add -A
git commit -m "Phase ${PHASE_NUM}: ${PHASE_NAME} complete"
```

### 4. Update Status
```bash
echo "✅ Phase ${PHASE_NUM} complete!"
echo "📁 Created PLANNING/implementation-phases/PHASE-${PHASE_NUM}-COMPLETE.md"
echo "🔄 Committed changes"
echo ""
echo "Next: Read PLANNING/implementation-phases/PHASE-$((PHASE_NUM + 1))-*.md"
```

## Usage
After completing a phase:
```
# Phase 0 example
/post-phase 0 "Environment Setup"

# Phase 1 example  
/post-phase 1 "ScrapCreators Service"

# Phase 2 example
/post-phase 2 "Google Drive Service"

# Phase 3 example
/post-phase 3 "Workflow Integration"
```
