---
name: status
description: Check project implementation status and what's complete vs pending
---

# Command: /status

## Purpose
Display current implementation status across all phases.

## Usage
```
/status
```

## Behavior
1. Check which phase files exist in `src/`
2. Verify TypeScript compilation
3. Check for required environment variables
4. Display completion status matrix

## Status Checks

### Phase 0: Setup
- [ ] `package.json` exists
- [ ] `tsconfig.json` configured
- [ ] `node_modules/` installed
- [ ] `npm run dev` works

### Phase 1: Whop Products
- [ ] `src/config/products.ts` exists
- [ ] `src/types/whop.ts` exists
- [ ] `src/services/whop-setup.ts` exists
- [ ] Products created in Whop dashboard

### Phase 2: Webhooks
- [ ] `src/webhooks/whop-handler.ts` exists
- [ ] `src/webhooks/events/membership.ts` exists
- [ ] Signature verification working
- [ ] Event routing functional

### Phase 3: Clippers
- [ ] `src/services/clipper-management.ts` exists
- [ ] `src/api/clippers.ts` exists
- [ ] Application experience created

### Phase 4: Drive
- [ ] `src/services/drive-service.ts` exists
- [ ] OAuth flow working
- [ ] Folder creation tested

### Phase 5: Admin API
- [ ] `src/api/routes.ts` exists
- [ ] All controllers created
- [ ] Auth middleware working

### Phase 6: Notifications
- [ ] `src/services/notifications.ts` exists
- [ ] Templates defined
- [ ] Test notification sent

## Output Format
```
📊 Implementation Status
========================

Phase 0: Setup           ✅ Complete
Phase 1: Whop Products   ⏳ In Progress (2/4)
Phase 2: Webhooks        ⬜ Not Started
Phase 3: Clippers        ⬜ Not Started
Phase 4: Drive           ⬜ Not Started
Phase 5: Admin API       ⬜ Not Started
Phase 6: Notifications   ⬜ Not Started

Overall: 17% Complete
Next: Complete Phase 1
```
