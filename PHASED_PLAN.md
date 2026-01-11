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

## Claude Code Integration

### Available Agents
Claude Code automatically invokes specialized agents for domain-specific tasks:

| Agent | Auto-Invoked For |
|-------|------------------|
| `whop-specialist` | Whop SDK usage, memberships, webhooks, notifications |
| `drive-specialist` | Google Drive API, folder management, permissions |
| `backend-dev` | TypeScript/Express, API design, Zod validation |

### Slash Commands
Quick commands available during development:

| Command | Purpose |
|---------|---------|
| `/phase [0-6]` | Load and execute a specific phase |
| `/status` | Check implementation progress across all phases |
| `/test-webhook [event]` | Send test webhook to local server |
| `/commit [type] [msg]` | Create conventional commit |

### Usage Example
```bash
# Start Claude Code
claude --dangerously-skip-permissions

# Check current progress
/status

# Execute a phase
/phase 2

# Test webhook handling
/test-webhook membership.went_valid

# Commit changes
/commit feat add webhook signature verification
```

---

## Implementation Order

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
   ↓         ↓         ↓         ↓         ↓         ↓         ↓
Setup   Products   Webhooks  Clippers   Drive     API     Notify
```

Each phase builds on the previous. Phase 0-2 are critical path for MVP.

---

## Phase 0: Project Initialization

### Objective
Set up project scaffolding, dependencies, and environment configuration.

### Agent Usage
- **backend-dev**: Project structure, TypeScript config, Express setup

### Claude Code Execution
```
/phase 0
```

Or manually:
```
Read docs/phases/PHASE_0_SETUP.md and execute all tasks.
```

### Files to Create
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript strict mode config
- `.env.example` - Environment template
- `.gitignore` - Git ignore patterns
- `src/index.ts` - Express entry point

### Success Criteria
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts server on port 3000
- [ ] `npm run typecheck` passes
- [ ] All environment variables documented in `.env.example`

---

## Phase 1: Whop Product Setup

### Objective
Create Whop company, products, and plans for clipping agency tiers.

### Agent Usage
- **whop-specialist**: Product/plan creation, SDK patterns
- **backend-dev**: Type definitions, service structure

### Claude Code Execution
```
/phase 1
```

### Files to Create
- `src/services/whop-setup.ts` - Product creation functions
- `src/types/whop.ts` - Whop type definitions
- `src/config/products.ts` - Tier configurations

### Key Whop API Endpoints
```typescript
// Products
whop.products.create({ ... })
whop.products.list({ ... })

// Plans
whop.plans.create({ ... })
```

### Success Criteria
- [ ] Three products created (Starter, Growth, Scale)
- [ ] Monthly plans configured for each tier
- [ ] Checkout flow configured with custom fields
- [ ] `npm run setup` creates products successfully

---

## Phase 2: Webhook Handler

### Objective
Handle Whop membership lifecycle events for auto-provisioning.

### Agent Usage
- **whop-specialist**: Event handling, signature verification
- **backend-dev**: Express middleware, error handling

### Claude Code Execution
```
/phase 2
```

### Files to Create
- `src/webhooks/whop-handler.ts` - Main webhook router
- `src/webhooks/events/membership.ts` - Membership event handlers
- `src/webhooks/middleware/verify-signature.ts` - Signature verification
- `src/types/webhook-events.ts` - Event type definitions

### Key Events
| Event | Trigger Action |
|-------|----------------|
| `membership.went_valid` | Trigger client onboarding, create Drive folder |
| `membership.went_invalid` | Revoke access, archive folder |
| `membership.updated` | Handle tier changes |

### Testing
```
/test-webhook membership.went_valid
```

### Success Criteria
- [ ] POST `/webhooks/whop` endpoint working
- [ ] Signature verification rejects invalid signatures
- [ ] All membership events handled
- [ ] Events logged for debugging

---

## Phase 3: Clipper Application System

### Objective
Build clipper recruitment and application management.

### Agent Usage
- **whop-specialist**: Experiences, entries, notifications
- **backend-dev**: API endpoints, validation schemas

### Claude Code Execution
```
/phase 3
```

### Files to Create
- `src/services/clipper-management.ts` - Application logic
- `src/api/clippers.ts` - Clipper API endpoints
- `src/types/clipper.ts` - Clipper type definitions

### Application Form Fields
- Name, Email, Portfolio URL
- Software proficiency (CapCut, Premiere, DaVinci)
- Clips per week capacity
- Rate per clip
- Sample work links

### Key Whop API Endpoints
```typescript
// Experiences (for applications)
whop.experiences.create({ ... })

// Entries (submitted applications)
whop.entries.list({ experience_id })

// Notifications
whop.notifications.create({ user_id, title, body })
```

### Success Criteria
- [ ] Application experience created in Whop
- [ ] API to list/review applications working
- [ ] Approval flow creates authorized user
- [ ] Notification sent on approval/rejection

---

## Phase 4: Drive Integration

### Objective
Integrate Google Drive for folder provisioning and content management.

### Agent Usage
- **drive-specialist**: OAuth, folder creation, permissions
- **backend-dev**: Service structure, error handling

### Claude Code Execution
```
/phase 4
```

### Files to Create
- `src/services/drive-service.ts` - Drive API wrapper
- `src/services/folder-templates.ts` - Folder structure definitions
- `src/config/drive.ts` - Drive configuration

### Folder Structure
```
Clipping Agency/
├── Clients/
│   └── {ClientName}/
│       ├── Raw Footage
│       ├── Clips In Progress
│       ├── Approved Clips
│       └── Brief & Guidelines
├── Clippers/
│   └── {ClipperName}/
│       ├── Assigned Work
│       └── Completed
└── Templates/
```

### Key Functions
```typescript
// Folder operations
createClientFolder(clientId, clientName)
createClipperFolder(clipperId, clipperName)
shareFolder(folderId, email, role)
duplicateTemplate(templateId, newName, parentId)
```

### Success Criteria
- [ ] OAuth flow working with token refresh
- [ ] Client folder creation working
- [ ] Clipper folder creation working
- [ ] Sharing permissions applied correctly
- [ ] Template duplication functional

---

## Phase 5: Admin Dashboard API

### Objective
Backend API for admin dashboard and monitoring.

### Agent Usage
- **backend-dev**: REST API design, Zod validation, auth middleware

### Claude Code Execution
```
/phase 5
```

### Files to Create
- `src/api/routes.ts` - Route definitions
- `src/api/controllers/clients.ts` - Client management
- `src/api/controllers/clippers.ts` - Clipper management
- `src/api/controllers/analytics.ts` - Metrics/reporting
- `src/api/middleware/auth.ts` - Authentication

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/clients` | List all clients with membership status |
| GET | `/api/clients/:id` | Client details with clip stats |
| GET | `/api/clippers` | List clippers with capacity |
| POST | `/api/assignments` | Assign clipper to client |
| GET | `/api/analytics` | Revenue, clips delivered, etc. |
| GET | `/api/notifications` | Pending tasks and alerts |

### Response Shape
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  pagination?: { page: number; limit: number; total: number };
}
```

### Success Criteria
- [ ] All endpoints return consistent response shape
- [ ] Zod validation on all inputs
- [ ] Auth middleware protecting routes
- [ ] Pagination on list endpoints

---

## Phase 6: Notification System

### Objective
Automated notifications for clients, clippers, and admins.

### Agent Usage
- **whop-specialist**: Notification API, templates

### Claude Code Execution
```
/phase 6
```

### Files to Create
- `src/services/notifications.ts` - Notification sender
- `src/templates/notification-templates.ts` - Message templates

### Notification Types

#### Client Notifications
- Welcome + onboarding instructions
- Clip ready for review
- Monthly report available

#### Clipper Notifications
- New assignment available
- Feedback received
- Payment processed

#### Admin Notifications
- New client signup
- Application received
- Clip overdue alert

### Key Function
```typescript
await whop.notifications.create({
  user_id: "user_xxx",
  title: "Welcome!",
  body: "Your account is ready.",
  action_url: "https://example.com/dashboard",
});
```

### Success Criteria
- [ ] All notification templates defined
- [ ] Welcome notification sent on signup
- [ ] Assignment notifications working
- [ ] Test notification sent successfully

---

## Quick Start

### Option 1: Using Slash Commands
```bash
cd whop-clipping-agency
claude --dangerously-skip-permissions

# Check status
/status

# Run phases sequentially
/phase 0
/phase 1
# ... etc
```

### Option 2: Full Automation
```bash
claude --dangerously-skip-permissions
```

Then paste:
```
Read docs/phases/PHASE_0_SETUP.md and execute all tasks.
After completing each phase, automatically proceed to the next phase prompt until all phases are complete.
Create PHASE-X-COMPLETE.md after each phase and git commit your changes.
```

---

## Environment Variables

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

---

## Phase Completion Tracking

After completing each phase, create `docs/phases/PHASE_X_COMPLETE.md`:

```markdown
# Phase X: [NAME] - COMPLETE

**Completed:** [DATE]

## Deliverables
- [x] [File/feature 1]
- [x] [File/feature 2]

## Verification
- `npm run typecheck`: ✅
- `npm run dev`: ✅

## Notes
[Any issues or deviations]

## Next Phase
Proceed to Phase [X+1]: [NAME]
```

Then commit:
```bash
git add -A
git commit -m "Phase X: [NAME] complete"
```

Or use:
```
/commit feat complete Phase X [NAME]
```
