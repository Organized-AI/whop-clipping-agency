# Whop Clipping Agency - Phased Implementation Plan

## Project Overview
Automated clipping agency management system built on Whop platform with Google Drive integration.

### Business Model
- Base: $3,000/month management fee + 10% ad spend
- Minimum ad budget: $2,000/month

### Pricing Tiers
| Tier | Monthly | Clips/Month | Ad Budget Range |
|------|---------|-------------|-----------------|
| Starter | $5,000 | 30 clips | $2k-$5k |
| Growth | $8,000 | 60 clips | $5k-$15k |
| Scale | $15,000 | 120 clips | $15k+ |

---

## Phase 0: Project Initialization

### Objective
Set up project scaffolding, dependencies, and environment configuration.

### Claude Code Prompt
```bash
claude --dangerously-skip-permissions

# Phase 0: Initialize Whop Clipping Agency project
# 1. Initialize Node.js TypeScript project with strict mode
# 2. Install dependencies: @whop/sdk, express, zod, dotenv, googleapis
# 3. Create .env.example with required variables:
#    - WHOP_API_KEY, WHOP_APP_ID, WHOP_WEBHOOK_SECRET
#    - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
#    - DATABASE_URL (for Supabase/Postgres)
# 4. Set up TypeScript config with path aliases (@/*)
# 5. Create base project structure matching src/ layout
# 6. Add scripts: dev, build, start, lint, typecheck
```

### Files to Create
- `package.json`
- `tsconfig.json`
- `.env.example`
- `.gitignore`
- `src/index.ts`

---

## Phase 1: Whop Product Setup

### Objective
Create Whop company, products, and plans for clipping agency tiers.

### Claude Code Prompt
```bash
claude --dangerously-skip-permissions

# Phase 1: Whop Product Configuration
# Using Whop SDK create:
# 1. Company with industry_type: "clipping_agency", business_type: "agency"
# 2. Three products:
#    - "Starter Package" ($5,000/mo) - 30 clips
#    - "Growth Package" ($8,000/mo) - 60 clips  
#    - "Scale Package" ($15,000/mo) - 120 clips
# 3. Plans with renewal type for each product
# 4. Checkout configuration with custom fields:
#    - Company name
#    - Website URL
#    - Monthly ad budget
#    - Primary social platforms
# Create src/services/whop-setup.ts with setup functions
```

### Files to Create
- `src/services/whop-setup.ts`
- `src/types/whop.ts`
- `src/config/products.ts`

### API Endpoints Used
- `create_companies`
- `retrieve_products` / `list_products`
- `list_plans`
- `list_checkout_configurations`

---

## Phase 2: Webhook Handler

### Objective
Handle Whop membership lifecycle events for auto-provisioning.

### Claude Code Prompt
```bash
claude --dangerously-skip-permissions

# Phase 2: Webhook Event Handler
# Create Express server with webhook endpoint:
# 1. POST /webhooks/whop - receives Whop events
# 2. Verify webhook signature using WHOP_WEBHOOK_SECRET
# 3. Handle events:
#    - membership.went_valid → trigger client onboarding
#    - membership.went_invalid → revoke access
#    - membership.updated → handle tier changes
# 4. Event router pattern for clean event handling
# 5. Queue system (BullMQ) for async processing
# Create src/webhooks/whop-handler.ts and src/webhooks/events/
```

### Files to Create
- `src/webhooks/whop-handler.ts`
- `src/webhooks/events/membership.ts`
- `src/webhooks/middleware/verify-signature.ts`
- `src/types/webhook-events.ts`

### Key Events
- `membership.went_valid`
- `membership.went_invalid`
- `membership.updated`

---

## Phase 3: Clipper Application System

### Objective
Build clipper recruitment and application management.

### Claude Code Prompt
```bash
claude --dangerously-skip-permissions

# Phase 3: Clipper Application System
# 1. Create Whop Experience for clipper applications
# 2. Application form fields:
#    - Name, Email, Portfolio URL
#    - Software proficiency (CapCut, Premiere, DaVinci)
#    - Clips per week capacity
#    - Rate per clip
#    - Sample work links
# 3. Application review dashboard data
# 4. Approval flow → creates authorized user in Whop
# 5. Rejection with feedback capability
# Create src/services/clipper-management.ts
```

### Files to Create
- `src/services/clipper-management.ts`
- `src/api/clippers.ts`
- `src/types/clipper.ts`

### API Endpoints Used
- `create_experiences`
- `list_entries` (waitlist/applications)
- `list_authorized_users`
- `create_notifications`

---

## Phase 4: Drive Integration

### Objective
Integrate Google Drive for folder provisioning and content management.

### Claude Code Prompt
```bash
claude --dangerously-skip-permissions

# Phase 4: Google Drive Integration
# 1. OAuth2 setup with googleapis
# 2. Service functions:
#    - createClientFolder(clientId, clientName)
#    - createClipperFolder(clipperId, clipperName)
#    - shareFolder(folderId, email, role)
#    - duplicateTemplate(templateId, newName, parentId)
# 3. Folder structure:
#    - /Clients/{ClientName}/Raw Footage, Clips In Progress, Approved
#    - /Clippers/{ClipperName}/Assigned Work, Completed
# 4. Webhook trigger integration for auto-provisioning
# Create src/services/drive-service.ts
```

### Files to Create
- `src/services/drive-service.ts`
- `src/services/folder-templates.ts`
- `src/config/drive.ts`

### Key Functions
- `createClientFolder()`
- `createClipperFolder()`
- `shareWithClipper()`
- `monitorFolderChanges()`

---

## Phase 5: Admin Dashboard API

### Objective
Backend API for admin dashboard and monitoring.

### Claude Code Prompt
```bash
claude --dangerously-skip-permissions

# Phase 5: Admin Dashboard API
# REST API endpoints:
# 1. GET /api/clients - list all clients with membership status
# 2. GET /api/clients/:id - client details with clip stats
# 3. GET /api/clippers - list clippers with capacity
# 4. POST /api/assignments - assign clipper to client
# 5. GET /api/analytics - revenue, clips delivered, etc.
# 6. GET /api/notifications - pending tasks and alerts
# Use Whop SDK for membership data
# Include Zod validation for all endpoints
# Create src/api/routes.ts and controllers
```

### Files to Create
- `src/api/routes.ts`
- `src/api/controllers/clients.ts`
- `src/api/controllers/clippers.ts`
- `src/api/controllers/analytics.ts`
- `src/api/middleware/auth.ts`

### API Endpoints Used
- `list_memberships`
- `retrieve_memberships`
- `list_members`
- `list_reviews`

---

## Phase 6: Notification System

### Objective
Automated notifications for clients, clippers, and admins.

### Claude Code Prompt
```bash
claude --dangerously-skip-permissions

# Phase 6: Notification System
# Using Whop Notifications API:
# 1. Client notifications:
#    - Welcome + onboarding instructions
#    - Clip ready for review
#    - Monthly report available
# 2. Clipper notifications:
#    - New assignment available
#    - Feedback received
#    - Payment processed
# 3. Admin notifications:
#    - New client signup
#    - Application received
#    - Clip overdue alert
# Create src/services/notifications.ts with templates
```

### Files to Create
- `src/services/notifications.ts`
- `src/templates/notification-templates.ts`

### API Endpoints Used
- `create_notifications`

---

## Implementation Order

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
   ↓         ↓         ↓         ↓         ↓         ↓         ↓
Setup   Products   Webhooks  Clippers   Drive     API     Notify
```

Each phase builds on the previous. Phase 0-2 are critical path for MVP.

---

## Environment Variables Required

```env
# Whop
WHOP_API_KEY=apik_xxx
WHOP_APP_ID=app_xxx
WHOP_WEBHOOK_SECRET=whsec_xxx

# Google Drive
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_DRIVE_PARENT_FOLDER=xxx

# Database
DATABASE_URL=postgresql://xxx

# Server
PORT=3000
NODE_ENV=development
```
