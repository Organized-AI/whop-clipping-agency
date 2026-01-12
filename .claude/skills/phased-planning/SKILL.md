---
name: phased-planning
description: Creates structured implementation plans with phase prompts for Claude Code execution. Use when building complex projects, creating implementation roadmaps, breaking work into phases, or generating Claude Code prompts for multi-step development. Triggers include "create implementation plan", "phase this project", "create phases for", "plan the build", "phased implementation", "break this into phases".
---

# Phased Planning Skill

Creates comprehensive phased implementation plans that generate copy-paste ready prompts for Claude Code execution, with success criteria and completion templates for each phase.

## Triggers

- "create implementation plan"
- "phase this project"
- "create phases for"
- "plan the build"
- "phased implementation"
- "create Claude Code prompts"
- "break this into phases"
- "implementation roadmap"

---

## Workflow

### Phase 0: Pre-Planning - Marketplace Scan ⭐ NEW

**Before creating phases, scan the plugin marketplace for relevant components:**

```bash
# Check marketplace for helpful plugins
# Repository: https://github.com/Organized-AI/plugin-marketplace
```

**Relevance Analysis:**

1. **Identify project type:**
   | Project Type | Recommended Plugins |
   |--------------|---------------------|
   | TypeScript/Node | context7, hookify, github |
   | Frontend/UI | frontend-design, hookify |
   | API Backend | context7, github, stripe (if payments) |
   | Database | supabase |
   | Tracking/Analytics | gtm-ai-plugin, fix-your-tracking |

2. **Check existing components:**
   ```bash
   ls .claude/agents/
   ls .claude/commands/
   ls .claude/hooks/
   ls .claude/skills/
   cat .mcp.json
   ```

3. **Install relevant plugins:**
   ```bash
   # Via plugin command
   /plugin install [plugin-name]@organized-ai-marketplace
   
   # Or manually copy from marketplace
   git clone https://github.com/Organized-AI/plugin-marketplace.git /tmp/marketplace
   cp -r /tmp/marketplace/[plugin]/[component-type]/* .claude/[component-type]/
   ```

4. **Configure MCP servers:**
   - Update `.mcp.json` with relevant MCP servers
   - Verify API keys/tokens are configured

**Marketplace Plugins Reference:**

| Plugin | Components | Use When |
|--------|------------|----------|
| context7 | MCP | Need up-to-date library docs |
| github | MCP | GitHub API operations |
| hookify | Commands, Hooks, Skills | Custom safety/workflow rules |
| stripe | Commands, Skills, MCP | Payment processing |
| supabase | MCP | Supabase database |
| frontend-design | Skills | Building UI components |
| agent-sdk-dev | Commands, Agents | Building Agent SDK apps |
| serena | MCP | Semantic code analysis |

---

### Phase 1: Project Analysis

After marketplace scan, gather project information:

```
1. Identify all components to build
2. Map dependencies between components
3. Determine optimal build order
4. Estimate phase complexity (3-12 tasks each)
```

### Phase 2: Create Master Plan

Generate `PLANNING/IMPLEMENTATION-MASTER-PLAN.md`:

```markdown
# [PROJECT NAME] - Implementation Master Plan

**Created:** [DATE]
**Project Path:** [PATH]
**Runtime:** [TECHNOLOGY]

---

## Pre-Implementation Checklist

### ✅ Marketplace Scan (Complete)
| Plugin | Status | Reason |
|--------|--------|--------|
| context7 | ✅ Installed | Library docs lookup |
| hookify | ✅ Installed | Safety hooks |
| [plugin] | ⏭️ Skipped | Not relevant |

### ✅ Documentation (Complete)
| Component | Location | Status |
|-----------|----------|--------|
| [Doc 1] | [path] | ✅ |

### ⏳ Code Implementation (To Build)
| Component | Location | Status |
|-----------|----------|--------|
| [Component 1] | [path] | ⏳ |

---

## Implementation Phases Overview

| Phase | Name | Files | Dependencies |
|-------|------|-------|--------------|
| 0 | Project Setup + Marketplace | package.json, .mcp.json | None |
| 1 | Core Infrastructure | src/lib/* | Phase 0 |
| ... | ... | ... | ... |
```

### Phase 3: Write Phase Prompts

For each phase, create `PLANNING/implementation-phases/PHASE-X-PROMPT.md`:

```markdown
# Phase [X]: [NAME]

## Objective
[One sentence describing what this phase accomplishes]

---

## Prerequisites
- Phase [X-1] complete
- [Other requirements]

---

## Context Files to Read
```
[file1.md]
[file2.md]
```

---

## Tasks

### 1. [Task Name]
[Description]

```[language]
// Complete code specification
```

### 2. [Task Name]
...

---

## Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

## Completion

Create `PHASE-[X]-COMPLETE.md` and commit:
```bash
git add -A
git commit -m "Phase [X]: [NAME] - [summary]"
```
```

### Phase 4: Create Quick-Start Prompt

Generate `CLAUDE-CODE-PHASE-0.md` at project root for easy copy-paste into Claude Code.

---

## Standard Phase Types (Updated)

| Phase | Name | Purpose |
|-------|------|---------|
| 0 | Project Setup + Marketplace | package.json, tsconfig, **marketplace scan**, MCP config |
| 1 | Core Infrastructure | Config, logging, utilities, base clients |
| 2 | Framework | Base classes, types, patterns |
| 3 | Core Logic | Main business logic implementation |
| 4-N | Feature Phases | Individual features/components |
| N+1 | Integration | CLI, tests, end-to-end verification |
| **Final** | **Post-Build Hardening** ⭐ NEW | **Critical fixes, cross-platform compatibility, production readiness** |

---

## Phase 0 Template (with Marketplace)

```markdown
# Phase 0: Project Setup + Marketplace Scan

## Objective
Initialize project structure, dependencies, and Claude Code components from marketplace.

---

## Prerequisites
- Node.js 18+ installed
- Git initialized
- Access to Organized-AI/plugin-marketplace

---

## Tasks

### 1. Scan Plugin Marketplace
```bash
# Check marketplace for relevant plugins
# Repository: https://github.com/Organized-AI/plugin-marketplace

# Analyze project needs:
# - TypeScript? → context7
# - API work? → github MCP
# - Safety needed? → hookify
```

### 2. Install Relevant Plugins
```bash
# Option A: Plugin command
/plugin marketplace add Organized-AI/plugin-marketplace
/plugin install context7@organized-ai-marketplace
/plugin install hookify@organized-ai-marketplace

# Option B: Manual copy
git clone https://github.com/Organized-AI/plugin-marketplace.git /tmp/marketplace
cp -r /tmp/marketplace/[plugin]/* .claude/
```

### 3. Configure MCP Servers
Update `.mcp.json`:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### 4. Initialize Project
```bash
npm init -y
npm install typescript @types/node tsx --save-dev
npx tsc --init
```

### 5. Create Directory Structure
[Standard structure...]

---

## Success Criteria
- [ ] Marketplace scanned for relevant plugins
- [ ] Relevant plugins installed
- [ ] MCP servers configured in .mcp.json
- [ ] package.json created
- [ ] TypeScript configured
- [ ] Directory structure created

---

## Completion
```bash
git add -A
git commit -m "Phase 0: Project setup with marketplace plugins"
```
```

---

## File Organization

```
PROJECT/
├── .claude/
│   ├── agents/           # From marketplace + custom
│   ├── commands/         # From marketplace + custom
│   ├── hooks/            # From marketplace + custom
│   ├── skills/           # From marketplace + custom
│   └── settings.local.json
├── .mcp.json             # MCP server config
├── PLANNING/
│   ├── IMPLEMENTATION-MASTER-PLAN.md
│   └── implementation-phases/
│       ├── PHASE-0-PROMPT.md
│       ├── PHASE-1-PROMPT.md
│       └── ...
├── CLAUDE-CODE-PHASE-0.md
└── CLAUDE.md
```

---

## Phase Sizing Guidelines

| Complexity | Tasks | Approx. Time |
|------------|-------|--------------|
| Simple | 3-5 tasks | 10-20 min |
| Medium | 5-8 tasks | 20-40 min |
| Complex | 8-12 tasks | 40-60 min |

**Rule:** If >12 tasks, split into sub-phases.

---

## Completion Template

```markdown
# Phase [X]: [NAME] - COMPLETE

**Completed:** [DATE]

## Deliverables
- [x] [File/feature 1]
- [x] [File/feature 2]

## Marketplace Plugins (Phase 0 only)
- [x] context7 - Library docs
- [x] hookify - Safety hooks
- [ ] stripe - Skipped (not needed)

## Verification
- `[command 1]`: ✅
- `[command 2]`: ✅

## Notes
[Any issues or deviations]

## Next Phase
Proceed to Phase [X+1]: [NAME]
```

---

## Execution Protocol

### Starting a Phase

```bash
cd [project]
claude --dangerously-skip-permissions

# In Claude Code:
"Read PLANNING/implementation-phases/PHASE-X-PROMPT.md and execute all tasks"
```

### Completing a Phase

1. Verify all success criteria checkboxes
2. Create `PHASE-X-COMPLETE.md` from template
3. Git commit with phase message
4. Move to next phase

---

## Best Practices

1. **Scan marketplace first** - Phase 0 always includes marketplace scan
2. **Complete code in prompts** - Don't leave implementation to inference
3. **Explicit success criteria** - Checkboxes that can be verified
4. **Clear dependencies** - State what must be complete first
5. **Git commits per phase** - Clean history with phase messages
6. **No time estimates** - Use phase order, not days/weeks
7. **Context files** - Always specify what to read first
8. **MCP configuration** - Ensure servers are configured before Phase 1
9. **Always end with hardening** - Post-build analysis reveals production issues ⭐ NEW

---

## Post-Build Hardening Phase ⭐ NEW

After completing all feature phases, **always create a hardening phase** to address issues discovered during the build. This phase catches problems that only become apparent after the full system is implemented.

### When to Create Hardening Phase

Create after:
- All feature phases complete
- Initial integration testing done
- Completeness analysis performed

### Hardening Phase Template

```markdown
# Phase [Final]: Post-Build Hardening & Fixes

## Objective
Address critical issues, improve cross-platform compatibility, and implement production-readiness improvements discovered during completeness analysis.

---

## Priority Levels

| Priority | Impact | Action |
|----------|--------|--------|
| 🔴 Critical | Breaks functionality | Must fix immediately |
| 🟠 High | Production issues | Should fix before deploy |
| 🟡 Medium | Quality/maintenance | Nice to have |
| 🔵 Low | Future improvements | Document for later |

---

## Common Hardening Tasks

### 🔴 Critical (Always Check)
- [ ] Cross-platform paths (no hard-coded `/tmp`, use `os.tmpdir()`)
- [ ] Missing input validation (all API endpoints use Zod schemas)
- [ ] Unhandled errors that crash the process
- [ ] Security vulnerabilities (injection, XSS, secrets in code)

### 🟠 High Priority (Usually Needed)
- [ ] Environment validation on startup
- [ ] Proper error logging (not silent catches)
- [ ] Request timeouts on external calls
- [ ] Webhook signature verification
- [ ] Input sanitization for file names/paths

### 🟡 Medium Priority (Recommended)
- [ ] Structured logging (replace console.log)
- [ ] Rate limiting for expensive operations
- [ ] Graceful shutdown handling
- [ ] Health check endpoints with dependency status
- [ ] API documentation (OpenAPI/Swagger)

### 🔵 Low Priority (Document for Later)
- [ ] Test suite implementation
- [ ] Performance optimizations
- [ ] Advanced monitoring/metrics
- [ ] Feature flags
- [ ] A/B testing infrastructure

---

## Completeness Analysis Process

Before writing the hardening phase, run this analysis:

1. **Service-by-service review:**
   - Are all methods fully implemented?
   - Any TODO comments or stubs?
   - Error handling consistent?

2. **API route audit:**
   - All routes have validation?
   - Error responses standardized?
   - Missing endpoints for CRUD operations?

3. **Configuration check:**
   - All env vars documented?
   - Defaults sensible?
   - Secrets properly handled?

4. **Cross-platform compatibility:**
   - File paths use path.join()?
   - No hard-coded OS-specific paths?
   - Line endings handled?

5. **Integration points:**
   - External API calls have timeouts?
   - Retries implemented where needed?
   - Fallbacks for degraded operation?

---

## Success Criteria Pattern

- [ ] All 🔴 Critical issues fixed
- [ ] All 🟠 High priority issues addressed
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] No regressions in existing functionality
- [ ] Server starts without errors
- [ ] Basic API endpoints respond correctly
```

### Why This Matters

Building software reveals issues that weren't visible during planning:

1. **Path assumptions** - Works on your machine, fails on Windows/CI
2. **Missing validation** - Happy path works, edge cases crash
3. **Silent failures** - Errors swallowed, debugging impossible
4. **Integration gaps** - Individual components work, together they don't
5. **Production blind spots** - Dev works, prod fails

The hardening phase catches these before users do.

---

## Integration

Works with:
- **organized-codebase-applicator** - For project structure
- **phase-0-template** - For quick project setup
- **tech-stack-orchestrator** - For component recommendations
- **scan-marketplace** - For plugin discovery ⭐ NEW
- **hookify** - For custom safety rules (from marketplace)
- **context7** - For library documentation (from marketplace)
