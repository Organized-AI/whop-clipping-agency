# Phase 3: Clipper Application System

## Claude Code Command
```bash
claude --dangerously-skip-permissions
```

## Instructions

Build clipper recruitment and application management system.

### 1. Create src/types/clipper.ts
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
```

### 2. Create src/services/clipper-management.ts
```typescript
import { WhopAPI } from "@whop/sdk";

const whop = new WhopAPI({ apiKey: process.env.WHOP_API_KEY });

export async function createClipperExperience() {
  // Create Whop Experience for clipper applications
  // Include application form fields
}

export async function getApplications(status?: string) {
  // Fetch from Whop entries (waitlist)
  const entries = await whop.entries.list({
    // filter by experience
  });
  return entries;
}

export async function approveApplication(applicationId: string) {
  // 1. Create authorized user in Whop
  // 2. Create clipper record in database
  // 3. Trigger Drive folder creation
  // 4. Send welcome notification
  // 5. Update application status
}

export async function rejectApplication(applicationId: string, feedback: string) {
  // 1. Update status
  // 2. Send rejection notification with feedback
}

export async function getClipperCapacity() {
  // Calculate total available capacity across all clippers
  // Return clippers with availability
}

export async function assignClipperToClient(
  clipperId: string,
  clientId: string,
  clipCount: number
) {
  // 1. Verify clipper has capacity
  // 2. Create assignment record
  // 3. Share client folder with clipper
  // 4. Notify both parties
  // 5. Update clipper current_assignments
}
```

### 3. Create src/api/clippers.ts
REST endpoints:
```typescript
import express from "express";
import * as clipperService from "../services/clipper-management";

const router = express.Router();

// List all clippers
router.get("/", async (req, res) => {
  const status = req.query.status as string;
  const clippers = await clipperService.getAllClippers(status);
  res.json(clippers);
});

// Get clipper applications
router.get("/applications", async (req, res) => {
  const status = req.query.status as string;
  const applications = await clipperService.getApplications(status);
  res.json(applications);
});

// Approve application
router.post("/applications/:id/approve", async (req, res) => {
  await clipperService.approveApplication(req.params.id);
  res.json({ success: true });
});

// Reject application
router.post("/applications/:id/reject", async (req, res) => {
  const { feedback } = req.body;
  await clipperService.rejectApplication(req.params.id, feedback);
  res.json({ success: true });
});

// Get available capacity
router.get("/capacity", async (req, res) => {
  const capacity = await clipperService.getClipperCapacity();
  res.json(capacity);
});

// Assign clipper to client
router.post("/assign", async (req, res) => {
  const { clipperId, clientId, clipCount } = req.body;
  await clipperService.assignClipperToClient(clipperId, clientId, clipCount);
  res.json({ success: true });
});

export default router;
```

## Whop API Endpoints Used
- `create_experiences` - Create application form
- `list_entries` - Get applications
- `create_notifications` - Send notifications

## Expected Output
- Clipper application experience in Whop
- Application review workflow
- Clipper assignment system
- Capacity tracking
