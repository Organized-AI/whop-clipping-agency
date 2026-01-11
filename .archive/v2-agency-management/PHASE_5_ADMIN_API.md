# Phase 5: Admin Dashboard API

## Objective
Build comprehensive REST API for admin dashboard and business monitoring.

---

## Prerequisites
- Phase 4 complete
- Understanding of Whop membership API

---

## Agent Usage
Claude Code will automatically invoke:
- **backend-dev**: REST API design, Zod validation, auth middleware

---

## Tasks

### 1. Create API Response Types

Create `src/types/api.ts`:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface DashboardOverview {
  revenue: {
    current_month: number;
    previous_month: number;
    growth_percent: number;
  };
  clients: {
    total: number;
    active: number;
    churned_this_month: number;
  };
  clippers: {
    total: number;
    active: number;
    utilization_percent: number;
  };
  clips: {
    delivered_this_month: number;
    pending: number;
    avg_turnaround_hours: number;
  };
}
```

### 2. Create Auth Middleware

Create `src/api/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from "express";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers["x-api-key"];

  if (!process.env.ADMIN_API_KEY) {
    console.error("ADMIN_API_KEY not configured");
    return res.status(500).json({
      success: false,
      error: { code: "CONFIG_ERROR", message: "Server misconfigured" },
    });
  }

  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid API key" },
    });
  }

  next();
}
```

### 3. Create Clients Controller

Create `src/api/controllers/clients.ts`:

```typescript
import { Router } from "express";
import { z } from "zod";
import { getWhopClient } from "../../lib/whop-client.js";
import { ApiResponse } from "../../types/api.js";

const router = Router();

// List all clients
router.get("/", async (req, res) => {
  try {
    const whop = getWhopClient();
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const status = req.query.status as string | undefined;

    const memberships = await whop.memberships.list({
      per: limit,
      page,
      status,
    });

    // Enrich with local data
    const clients = memberships.data.map(m => ({
      id: m.id,
      user_id: m.user_id,
      product_id: m.product_id,
      status: m.status,
      valid: m.valid,
      created_at: m.created_at,
      metadata: m.metadata,
      // TODO: Add clip stats, clipper assignments from local DB
    }));

    const response: ApiResponse<typeof clients> = {
      success: true,
      data: clients,
      pagination: {
        page,
        limit,
        total: memberships.pagination?.total_count || clients.length,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to fetch clients" },
    });
  }
});

// Get single client
router.get("/:id", async (req, res) => {
  try {
    const whop = getWhopClient();

    const membership = await whop.memberships.retrieve({
      id: req.params.id,
    });

    // Enrich with local data
    const client = {
      ...membership,
      // TODO: Add from local DB
      clips_delivered: 0,
      clips_pending: 0,
      assigned_clipper: null,
      drive_folder_url: null,
    };

    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to fetch client" },
    });
  }
});

// Pause client
router.post("/:id/pause", async (req, res) => {
  try {
    const whop = getWhopClient();
    await whop.memberships.pause({ id: req.params.id });

    res.json({ success: true });
  } catch (error) {
    console.error("Error pausing client:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to pause client" },
    });
  }
});

// Resume client
router.post("/:id/resume", async (req, res) => {
  try {
    const whop = getWhopClient();
    await whop.memberships.resume({ id: req.params.id });

    res.json({ success: true });
  } catch (error) {
    console.error("Error resuming client:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to resume client" },
    });
  }
});

export default router;
```

### 4. Create Analytics Controller

Create `src/api/controllers/analytics.ts`:

```typescript
import { Router } from "express";
import { getWhopClient } from "../../lib/whop-client.js";
import { DashboardOverview } from "../../types/api.js";

const router = Router();

// Dashboard overview
router.get("/overview", async (_req, res) => {
  try {
    const whop = getWhopClient();

    // Get membership counts
    const activeMemberships = await whop.memberships.list({
      status: "active",
      per: 1,
    });

    // Build overview data
    const overview: DashboardOverview = {
      revenue: {
        current_month: 0, // TODO: Calculate from transactions
        previous_month: 0,
        growth_percent: 0,
      },
      clients: {
        total: activeMemberships.pagination?.total_count || 0,
        active: activeMemberships.pagination?.total_count || 0,
        churned_this_month: 0, // TODO: Calculate
      },
      clippers: {
        total: 0, // TODO: From local DB
        active: 0,
        utilization_percent: 0,
      },
      clips: {
        delivered_this_month: 0, // TODO: From local DB
        pending: 0,
        avg_turnaround_hours: 0,
      },
    };

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error("Error fetching overview:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to fetch overview" },
    });
  }
});

// Revenue breakdown
router.get("/revenue", async (req, res) => {
  try {
    const { start_date, end_date, group_by = "day" } = req.query;

    // TODO: Implement revenue breakdown
    const revenueData = {
      period: { start: start_date, end: end_date },
      group_by,
      data: [], // TODO: Populate from transactions
    };

    res.json({
      success: true,
      data: revenueData,
    });
  } catch (error) {
    console.error("Error fetching revenue:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to fetch revenue" },
    });
  }
});

// Client performance
router.get("/clients/performance", async (_req, res) => {
  try {
    // TODO: Implement client performance metrics
    const performance = {
      total_clients: 0,
      avg_clips_per_client: 0,
      avg_satisfaction: 0,
      retention_rate: 0,
    };

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error("Error fetching client performance:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to fetch performance" },
    });
  }
});

// Clipper performance
router.get("/clippers/performance", async (_req, res) => {
  try {
    // TODO: Implement clipper performance metrics
    const performance = {
      total_clippers: 0,
      avg_clips_delivered: 0,
      avg_rating: 0,
      avg_turnaround_hours: 0,
    };

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error("Error fetching clipper performance:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to fetch performance" },
    });
  }
});

export default router;
```

### 5. Create Main API Router

Create `src/api/routes.ts`:

```typescript
import { Router } from "express";
import { authMiddleware } from "./middleware/auth.js";
import clientsRouter from "./controllers/clients.js";
import analyticsRouter from "./controllers/analytics.js";
import clippersRouter from "./clippers.js";

const router = Router();

// Apply auth to all API routes
router.use(authMiddleware);

// Mount routes
router.use("/clients", clientsRouter);
router.use("/clippers", clippersRouter);
router.use("/analytics", analyticsRouter);

// API info
router.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      name: "Whop Clipping Agency Admin API",
      version: "1.0.0",
      endpoints: [
        "GET /api/clients",
        "GET /api/clients/:id",
        "POST /api/clients/:id/pause",
        "POST /api/clients/:id/resume",
        "GET /api/clippers",
        "GET /api/clippers/applications",
        "POST /api/clippers/applications/:id/approve",
        "POST /api/clippers/applications/:id/reject",
        "GET /api/clippers/capacity",
        "POST /api/clippers/assign",
        "GET /api/analytics/overview",
        "GET /api/analytics/revenue",
        "GET /api/analytics/clients/performance",
        "GET /api/analytics/clippers/performance",
      ],
    },
  });
});

export default router;
```

### 6. Update Main Entry Point

Update `src/index.ts`:

```typescript
import apiRouter from "./api/routes.js";

// Replace individual route mounts with:
app.use("/api", apiRouter);
```

### 7. Add ADMIN_API_KEY to Environment

Update `.env.example`:

```env
# Admin
ADMIN_API_KEY=your_secure_admin_api_key_here
```

---

## Success Criteria

- [ ] All endpoints protected by API key authentication
- [ ] GET `/api` returns endpoint list
- [ ] GET `/api/clients` returns paginated clients
- [ ] GET `/api/clients/:id` returns client details
- [ ] POST `/api/clients/:id/pause` pauses membership
- [ ] POST `/api/clients/:id/resume` resumes membership
- [ ] GET `/api/analytics/overview` returns dashboard data
- [ ] All responses follow `ApiResponse` format
- [ ] Proper error handling on all endpoints

---

## Verification Commands

```bash
# Verify TypeScript compiles
npm run typecheck

# Test with API key
curl -H "x-api-key: your_key" http://localhost:3000/api
curl -H "x-api-key: your_key" http://localhost:3000/api/clients
curl -H "x-api-key: your_key" http://localhost:3000/api/analytics/overview

# Test without API key (should fail)
curl http://localhost:3000/api/clients
```

---

## Completion

Create `docs/phases/PHASE_5_COMPLETE.md`:

```markdown
# Phase 5: Admin Dashboard API - COMPLETE

**Completed:** [DATE]

## Deliverables
- [x] src/types/api.ts - API types
- [x] src/api/middleware/auth.ts - Auth middleware
- [x] src/api/controllers/clients.ts - Client endpoints
- [x] src/api/controllers/analytics.ts - Analytics endpoints
- [x] src/api/routes.ts - Main router

## Endpoints Created
- GET /api (endpoint list)
- GET /api/clients
- GET /api/clients/:id
- POST /api/clients/:id/pause
- POST /api/clients/:id/resume
- GET /api/analytics/overview
- GET /api/analytics/revenue
- GET /api/analytics/clients/performance
- GET /api/analytics/clippers/performance

## Verification
- `npm run typecheck`: ✅
- Auth middleware working: ✅
- All endpoints responding: ✅

## Next Phase
Proceed to Phase 6: Notification System
```

Then commit:
```bash
git add -A && git commit -m "Phase 5: Admin dashboard API complete"
```

Or use: `/commit feat Phase 5 Admin dashboard API complete`
