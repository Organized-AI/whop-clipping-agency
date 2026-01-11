---
name: phase
description: Load and execute a specific implementation phase
arguments:
  - name: number
    description: Phase number (0-6 for Whop, clip-0 to clip-3 for clips)
    required: true
---

# Command: /phase

## Purpose
Load and execute implementation phases for either Whop platform setup or clip import workflow.

## Usage
```
/phase [number|clip-number]
```

## Available Phases

### Whop Platform Phases (Original)
| Phase | Name | File |
|-------|------|------|
| 0 | Project Setup | `docs/phases/PHASE_0_SETUP.md` |
| 1 | Whop Products | `docs/phases/PHASE_1_WHOP_PRODUCTS.md` |
| 2 | Webhooks | `docs/phases/PHASE_2_WEBHOOKS.md` |
| 3 | Clipper System | `docs/phases/PHASE_3_CLIPPERS.md` |
| 4 | Drive Integration | `docs/phases/PHASE_4_DRIVE.md` |
| 5 | Admin API | `docs/phases/PHASE_5_ADMIN_API.md` |
| 6 | Notifications | `docs/phases/PHASE_6_NOTIFICATIONS.md` |

### ScrapCreators Clip Import Phases
| Phase | Name | File |
|-------|------|------|
| clip-0 | Environment Setup | `PLANNING/implementation-phases/PHASE-0-ENV-SETUP.md` |
| clip-1 | ScrapCreators Service | `PLANNING/implementation-phases/PHASE-1-SCRAPCREATORS.md` |
| clip-2 | Google Drive Service | `PLANNING/implementation-phases/PHASE-2-DRIVE-SERVICE.md` |
| clip-3 | Workflow Integration | `PLANNING/implementation-phases/PHASE-3-WORKFLOW.md` |

## Examples
```
# Whop phases
/phase 0    # Project Setup
/phase 4    # Drive Integration

# Clip import phases
/phase clip-0    # Environment Setup
/phase clip-1    # ScrapCreators Service
/phase clip-2    # Google Drive Service
/phase clip-3    # Workflow Integration
```

## Behavior
1. Read the specified phase file
2. Display phase objectives and requirements
3. Load relevant agent context
4. Begin implementation following phase instructions
5. Create all files specified in the phase
6. Run verification commands
7. Commit changes when phase is complete

## Quick Start (Clip Import)
```
/phase clip-0
# After completion:
/phase clip-1
# After completion:
/phase clip-2
# After completion:
/phase clip-3
```

## After Each Phase
1. Verify success criteria
2. Run `/test` for relevant suite
3. Commit with descriptive message
4. Proceed to next phase
