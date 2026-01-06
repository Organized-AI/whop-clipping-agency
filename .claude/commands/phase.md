---
name: phase
description: Load and execute a specific implementation phase from docs/phases/
---

# Command: /phase

## Purpose
Quickly load and begin implementing a specific phase of the clipping agency project.

## Usage
```
/phase [number]
```

## Behavior
1. Read `docs/phases/PHASE_{number}_*.md`
2. Display phase objectives and requirements
3. Begin implementation following the phase instructions
4. Create all files specified in the phase
5. Commit changes when phase is complete

## Examples
- `/phase 0` - Load Phase 0: Project Setup
- `/phase 1` - Load Phase 1: Whop Products
- `/phase 2` - Load Phase 2: Webhooks
- `/phase 3` - Load Phase 3: Clipper System
- `/phase 4` - Load Phase 4: Drive Integration
- `/phase 5` - Load Phase 5: Admin API
- `/phase 6` - Load Phase 6: Notifications

## Phase Files
- `docs/phases/PHASE_0_SETUP.md`
- `docs/phases/PHASE_1_WHOP_PRODUCTS.md`
- `docs/phases/PHASE_2_WEBHOOKS.md`
- `docs/phases/PHASE_3_CLIPPERS.md`
- `docs/phases/PHASE_4_DRIVE.md`
- `docs/phases/PHASE_5_ADMIN_API.md`
- `docs/phases/PHASE_6_NOTIFICATIONS.md`
