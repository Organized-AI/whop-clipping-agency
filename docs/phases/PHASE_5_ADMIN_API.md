# Phase 5: Admin Dashboard API

## Claude Code Command
```bash
claude --dangerously-skip-permissions
```

## Instructions

Build REST API for admin dashboard and monitoring.

### 1. Create src/api/routes.ts
Main API router:
```typescript
import express from "express";
import clientsRouter from "./controllers/clients";
import clippersRouter from "./controllers/clippers";
import analyticsRouter from "./controllers/analytics";
import { authMiddleware } from "./middleware/auth";

const router = express.Router();

// Apply auth to all routes
router.use(authMiddleware);

router.use("/clients", clientsRouter);
router.use("/clippers", clippersRouter);
router.use("/analytics", analyticsRouter);

export default router;
```

### 2. Create src/api/middleware/auth.ts
```typescript
import { Request, Response, NextFunction } from "express";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers["x-api-key"];
  
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  next();
}
```

### 3. Create src/api/controllers/clients.ts
```typescript
import express from "express";
import { WhopAPI } from "@whop/sdk";
import { z } from "zod";

const router = express.Router();
const whop = new WhopAPI({ apiKey: process.env.WHOP_API_KEY });

// List all clients
router.get("/", async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const memberships = await whop.memberships.list({
    per: Number(limit),
    page: Number(page),
    status: status as string,
  });
  
  // Enrich with local data (clip counts, clipper assignments)
  const enrichedClients = await enrichMembershipData(memberships);
  
  res.json({
    data: enrichedClients,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: memberships.pagination?.total_count,
    },
  });
});

// Get single client details
router.get("/:id", async (req, res) => {
  const membership = await whop.memberships.retrieve({
    id: req.params.id,
  });
  
  // Get clip stats, assigned clippers, folder info
  const enrichedClient = await getClientDetails(membership);
  
  res.json(enrichedClient);
});

// Update client tier
router.patch("/:id", async (req, res) => {
  const updateSchema = z.object({
    plan_id: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  });
  
  const data = updateSchema.parse(req.body);
  
  // Update via Whop API
  // Note: Tier changes may need to go through proper upgrade/downgrade flow
  
  res.json({ success: true });
});

// Pause client
router.post("/:id/pause", async (req, res) => {
  await whop.memberships.pause({ id: req.params.id });
  res.json({ success: true });
});

// Resume client
router.post("/:id/resume", async (req, res) => {
  await whop.memberships.resume({ id: req.params.id });
  res.json({ success: true });
});

export default router;
```

### 4. Create src/api/controllers/analytics.ts
```typescript
import express from "express";

const router = express.Router();

// Dashboard overview
router.get("/overview", async (req, res) => {
  const overview = {
    revenue: {
      current_month: await calculateMonthlyRevenue(),
      previous_month: await calculateMonthlyRevenue(-1),
      growth_percent: 0, // calculate
    },
    clients: {
      total: await getClientCount(),
      active: await getClientCount("active"),
      churned_this_month: await getChurnedCount(),
    },
    clippers: {
      total: await getClipperCount(),
      active: await getClipperCount("active"),
      utilization_percent: await calculateUtilization(),
    },
    clips: {
      delivered_this_month: await getClipsDelivered(),
      pending: await getPendingClips(),
      avg_turnaround_hours: await getAvgTurnaround(),
    },
  };
  
  res.json(overview);
});

// Revenue breakdown
router.get("/revenue", async (req, res) => {
  const { start_date, end_date, group_by = "day" } = req.query;
  
  // Get revenue data grouped by time period
  const revenueData = await getRevenueBreakdown(
    start_date as string,
    end_date as string,
    group_by as string
  );
  
  res.json(revenueData);
});

// Client performance
router.get("/clients/performance", async (req, res) => {
  // Clips delivered, on-time rate, satisfaction
  const performance = await getClientPerformanceMetrics();
  res.json(performance);
});

// Clipper performance
router.get("/clippers/performance", async (req, res) => {
  // Clips delivered, avg rating, capacity utilization
  const performance = await getClipperPerformanceMetrics();
  res.json(performance);
});

export default router;
```

### 5. Update src/index.ts
```typescript
import apiRouter from "./api/routes";

// Mount API routes
app.use("/api", apiRouter);
```

## Whop API Endpoints Used
- `list_memberships`
- `retrieve_memberships`
- `update_memberships`
- `pause_memberships`
- `resume_memberships`
- `list_members`
- `list_reviews`

## Expected Output
- RESTful API at `/api/*`
- Client management endpoints
- Clipper management endpoints
- Analytics and reporting endpoints
- Proper authentication middleware
