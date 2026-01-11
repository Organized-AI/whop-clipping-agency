# Phase 3: Clipper Application System

## Objective
Build clipper recruitment and application management system with approval workflows.

---

## Prerequisites
- Phase 2 complete
- Whop experiences/entries API available

---

## Agent Usage
Claude Code will automatically invoke:
- **whop-specialist**: Experiences, entries, notifications
- **backend-dev**: API endpoints, validation schemas

---

## Tasks

### 1. Create Clipper Type Definitions

Create `src/types/clipper.ts`:

```typescript
export interface ClipperApplication {
  id: string;
  name: string;
  email: string;
  portfolio_url: string;
  software_proficiency: SoftwareSkill[];
  clips_per_week_capacity: number;
  rate_per_clip: number; // in cents
  sample_work_urls: string[];
  status: "pending" | "approved" | "rejected";
  applied_at: Date;
  reviewed_at?: Date;
  notes?: string;
}

export type SoftwareSkill =
  | "capcut"
  | "premiere"
  | "davinci"
  | "after_effects"
  | "final_cut";

export interface Clipper {
  id: string;
  whop_user_id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "suspended";
  capacity_per_week: number;
  current_assignments: number;
  rate_per_clip: number;
  drive_folder_id?: string;
  total_clips_delivered: number;
  avg_rating: number;
  joined_at: Date;
}

export interface ClipperAssignment {
  id: string;
  clipper_id: string;
  client_id: string;
  clip_count: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date: Date;
  created_at: Date;
  completed_at?: Date;
}
```

### 2. Create Clipper Management Service

Create `src/services/clipper-management.ts`:

```typescript
import { getWhopClient } from "../lib/whop-client.js";
import { Clipper, ClipperApplication, ClipperAssignment } from "../types/clipper.js";

export async function createClipperExperience() {
  const whop = getWhopClient();

  console.log("Creating clipper application experience...");

  const experience = await whop.experiences.create({
    name: "Clipper Application",
    // Additional config as needed
  });

  console.log(`Created experience: ${experience.id}`);
  return experience;
}

export async function getApplications(status?: string): Promise<ClipperApplication[]> {
  const whop = getWhopClient();

  const entries = await whop.entries.list({
    // Filter by experience and status
  });

  // Transform to ClipperApplication format
  return entries.data.map(entry => ({
    id: entry.id,
    name: entry.metadata?.name || "",
    email: entry.metadata?.email || "",
    portfolio_url: entry.metadata?.portfolio_url || "",
    software_proficiency: entry.metadata?.software_proficiency || [],
    clips_per_week_capacity: entry.metadata?.clips_per_week_capacity || 0,
    rate_per_clip: entry.metadata?.rate_per_clip || 0,
    sample_work_urls: entry.metadata?.sample_work_urls || [],
    status: "pending",
    applied_at: new Date(entry.created_at * 1000),
  }));
}

export async function approveApplication(applicationId: string): Promise<Clipper> {
  const whop = getWhopClient();

  console.log(`Approving application: ${applicationId}`);

  // 1. Get the application details
  const entry = await whop.entries.retrieve({ id: applicationId });

  // 2. Create authorized user in Whop
  // await whop.authorizedUsers.create({ ... });

  // 3. Create clipper record
  const clipper: Clipper = {
    id: `clip_${Date.now()}`,
    whop_user_id: entry.user_id,
    name: entry.metadata?.name || "",
    email: entry.metadata?.email || "",
    status: "active",
    capacity_per_week: entry.metadata?.clips_per_week_capacity || 10,
    current_assignments: 0,
    rate_per_clip: entry.metadata?.rate_per_clip || 5000,
    total_clips_delivered: 0,
    avg_rating: 0,
    joined_at: new Date(),
  };

  // 4. TODO Phase 4: Create Drive folder for clipper
  // clipper.drive_folder_id = await createClipperFolder(clipper.id, clipper.name);

  // 5. TODO Phase 6: Send welcome notification
  // await notifyClipperWelcome(clipper.whop_user_id, clipper.drive_folder_id);

  console.log(`✅ Clipper approved: ${clipper.name}`);
  return clipper;
}

export async function rejectApplication(
  applicationId: string,
  feedback: string
): Promise<void> {
  const whop = getWhopClient();

  console.log(`Rejecting application: ${applicationId}`);
  console.log(`Feedback: ${feedback}`);

  // Update entry status
  // Send rejection notification with feedback
  // await whop.notifications.create({ ... });

  console.log(`❌ Application rejected: ${applicationId}`);
}

export async function getClipperCapacity(): Promise<{
  total_capacity: number;
  available_capacity: number;
  clippers: Array<{ id: string; name: string; available: number }>;
}> {
  // Get all active clippers and calculate available capacity
  const clippers: Clipper[] = []; // TODO: Fetch from database

  const capacity = clippers.reduce(
    (acc, clipper) => ({
      total_capacity: acc.total_capacity + clipper.capacity_per_week,
      available_capacity:
        acc.available_capacity + (clipper.capacity_per_week - clipper.current_assignments),
    }),
    { total_capacity: 0, available_capacity: 0 }
  );

  return {
    ...capacity,
    clippers: clippers.map(c => ({
      id: c.id,
      name: c.name,
      available: c.capacity_per_week - c.current_assignments,
    })),
  };
}

export async function assignClipperToClient(
  clipperId: string,
  clientId: string,
  clipCount: number
): Promise<ClipperAssignment> {
  console.log(`Assigning clipper ${clipperId} to client ${clientId}`);
  console.log(`Clip count: ${clipCount}`);

  // 1. Verify clipper has capacity
  // 2. Create assignment record
  const assignment: ClipperAssignment = {
    id: `asgn_${Date.now()}`,
    clipper_id: clipperId,
    client_id: clientId,
    clip_count: clipCount,
    status: "pending",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    created_at: new Date(),
  };

  // 3. TODO Phase 4: Share client folder with clipper
  // await shareClientFolderWithClipper(clientId, clipperEmail);

  // 4. TODO Phase 6: Notify both parties
  // await notifyNewAssignment(clipperId, clientName, clipCount);

  console.log(`✅ Assignment created: ${assignment.id}`);
  return assignment;
}

export async function getAllClippers(status?: string): Promise<Clipper[]> {
  // TODO: Fetch from database with optional status filter
  return [];
}
```

### 3. Create Clipper API Endpoints

Create `src/api/clippers.ts`:

```typescript
import { Router } from "express";
import { z } from "zod";
import * as clipperService from "../services/clipper-management.js";

const router = Router();

// List all clippers
router.get("/", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const clippers = await clipperService.getAllClippers(status);

    res.json({
      success: true,
      data: clippers,
    });
  } catch (error) {
    console.error("Error fetching clippers:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to fetch clippers" },
    });
  }
});

// Get clipper applications
router.get("/applications", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const applications = await clipperService.getApplications(status);

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to fetch applications" },
    });
  }
});

// Approve application
router.post("/applications/:id/approve", async (req, res) => {
  try {
    const clipper = await clipperService.approveApplication(req.params.id);

    res.json({
      success: true,
      data: clipper,
    });
  } catch (error) {
    console.error("Error approving application:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to approve application" },
    });
  }
});

// Reject application
const RejectSchema = z.object({
  feedback: z.string().min(1, "Feedback is required"),
});

router.post("/applications/:id/reject", async (req, res) => {
  try {
    const { feedback } = RejectSchema.parse(req.body);
    await clipperService.rejectApplication(req.params.id, feedback);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION", message: error.errors[0].message },
      });
    }

    console.error("Error rejecting application:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to reject application" },
    });
  }
});

// Get available capacity
router.get("/capacity", async (_req, res) => {
  try {
    const capacity = await clipperService.getClipperCapacity();

    res.json({
      success: true,
      data: capacity,
    });
  } catch (error) {
    console.error("Error fetching capacity:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to fetch capacity" },
    });
  }
});

// Assign clipper to client
const AssignSchema = z.object({
  clipperId: z.string().min(1),
  clientId: z.string().min(1),
  clipCount: z.number().positive(),
});

router.post("/assign", async (req, res) => {
  try {
    const { clipperId, clientId, clipCount } = AssignSchema.parse(req.body);
    const assignment = await clipperService.assignClipperToClient(
      clipperId,
      clientId,
      clipCount
    );

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION", message: error.errors[0].message },
      });
    }

    console.error("Error creating assignment:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL", message: "Failed to create assignment" },
    });
  }
});

export default router;
```

### 4. Update Main Entry Point

Add clipper routes to `src/index.ts`:

```typescript
import clipperRouter from "./api/clippers.js";

// Add after webhook routes
app.use("/api/clippers", clipperRouter);
```

---

## Success Criteria

- [ ] `src/types/clipper.ts` defines all clipper types
- [ ] `src/services/clipper-management.ts` has all service functions
- [ ] `src/api/clippers.ts` exposes REST endpoints
- [ ] GET `/api/clippers` returns clipper list
- [ ] GET `/api/clippers/applications` returns applications
- [ ] POST `/api/clippers/applications/:id/approve` approves application
- [ ] POST `/api/clippers/applications/:id/reject` rejects with feedback
- [ ] GET `/api/clippers/capacity` returns capacity info
- [ ] POST `/api/clippers/assign` creates assignment

---

## Verification Commands

```bash
# Verify TypeScript compiles
npm run typecheck

# Test endpoints
curl http://localhost:3000/api/clippers
curl http://localhost:3000/api/clippers/capacity
```

---

## Completion

Create `docs/phases/PHASE_3_COMPLETE.md`:

```markdown
# Phase 3: Clipper Application System - COMPLETE

**Completed:** [DATE]

## Deliverables
- [x] src/types/clipper.ts - Type definitions
- [x] src/services/clipper-management.ts - Service functions
- [x] src/api/clippers.ts - REST endpoints

## Endpoints Created
- GET /api/clippers
- GET /api/clippers/applications
- POST /api/clippers/applications/:id/approve
- POST /api/clippers/applications/:id/reject
- GET /api/clippers/capacity
- POST /api/clippers/assign

## Verification
- `npm run typecheck`: ✅
- API endpoints responding: ✅

## Next Phase
Proceed to Phase 4: Drive Integration
```

Then commit:
```bash
git add -A && git commit -m "Phase 3: Clipper application system complete"
```

Or use: `/commit feat Phase 3 clipper application system complete`
