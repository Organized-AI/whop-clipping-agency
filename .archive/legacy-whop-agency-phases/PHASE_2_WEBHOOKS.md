# Phase 2: Webhook Handler

## Objective
Implement secure Whop webhook handling for membership lifecycle events with signature verification.

---

## Prerequisites
- Phase 1 complete
- `WHOP_WEBHOOK_SECRET` configured in `.env`

---

## Agent Usage
Claude Code will automatically invoke:
- **whop-specialist**: Event handling, signature verification patterns
- **backend-dev**: Express middleware, error handling

---

## Tasks

### 1. Create Webhook Event Types

Create `src/types/webhook-events.ts`:

```typescript
export type WebhookEventType =
  | "membership.went_valid"
  | "membership.went_invalid"
  | "membership.updated"
  | "membership.created"
  | "payment.succeeded"
  | "payment.failed";

export interface WebhookEvent<T = unknown> {
  type: WebhookEventType;
  data: T;
  created_at: number;
}

export interface MembershipEventData {
  membership_id: string;
  product_id: string;
  plan_id: string;
  user_id: string;
  user_email: string;
  status: string;
  valid: boolean;
  metadata?: {
    company_name?: string;
    website_url?: string;
    monthly_ad_budget?: number;
    primary_platforms?: string;
  };
}

export interface PaymentEventData {
  payment_id: string;
  membership_id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "failed";
}

export type MembershipEvent = WebhookEvent<MembershipEventData>;
export type PaymentEvent = WebhookEvent<PaymentEventData>;
```

### 2. Create Signature Verification Middleware

Create `src/webhooks/middleware/verify-signature.ts`:

```typescript
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

export function verifyWhopSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signature = req.headers["whop-signature"] as string;
  const secret = process.env.WHOP_WEBHOOK_SECRET;

  if (!secret) {
    console.error("WHOP_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  if (!signature) {
    console.warn("Missing whop-signature header");
    return res.status(401).json({ error: "Missing signature" });
  }

  // Get raw body for signature verification
  const rawBody = JSON.stringify(req.body);

  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );

    if (!isValid) {
      console.warn("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }
  } catch (error) {
    console.warn("Signature verification failed:", error);
    return res.status(401).json({ error: "Invalid signature" });
  }

  next();
}
```

### 3. Create Membership Event Handlers

Create `src/webhooks/events/membership.ts`:

```typescript
import { MembershipEventData } from "../../types/webhook-events.js";

export async function handleMembershipValid(data: MembershipEventData) {
  console.log("🎉 Membership went valid:", data.membership_id);
  console.log("   User:", data.user_email);
  console.log("   Product:", data.product_id);

  // TODO Phase 4: Create Drive folder for client
  // await createClientFolder(data);

  // TODO Phase 6: Send welcome notification
  // await sendWelcomeNotification(data);

  return {
    action: "onboarding_triggered",
    membership_id: data.membership_id,
  };
}

export async function handleMembershipInvalid(data: MembershipEventData) {
  console.log("⚠️ Membership went invalid:", data.membership_id);
  console.log("   User:", data.user_email);
  console.log("   Status:", data.status);

  // TODO Phase 4: Revoke Drive folder access
  // await revokeClientAccess(data);

  return {
    action: "access_revoked",
    membership_id: data.membership_id,
  };
}

export async function handleMembershipUpdated(data: MembershipEventData) {
  console.log("📝 Membership updated:", data.membership_id);
  console.log("   Product:", data.product_id);
  console.log("   Valid:", data.valid);

  // Handle tier changes
  // TODO: Adjust clip quota based on new tier

  return {
    action: "membership_updated",
    membership_id: data.membership_id,
  };
}

export async function handleMembershipCreated(data: MembershipEventData) {
  console.log("✨ Membership created:", data.membership_id);
  console.log("   User:", data.user_email);
  console.log("   Metadata:", data.metadata);

  // Log new client info
  if (data.metadata) {
    console.log("   Company:", data.metadata.company_name);
    console.log("   Website:", data.metadata.website_url);
    console.log("   Budget:", data.metadata.monthly_ad_budget);
  }

  return {
    action: "membership_logged",
    membership_id: data.membership_id,
  };
}
```

### 4. Create Webhook Router

Create `src/webhooks/whop-handler.ts`:

```typescript
import { Router, Request, Response } from "express";
import { verifyWhopSignature } from "./middleware/verify-signature.js";
import {
  handleMembershipValid,
  handleMembershipInvalid,
  handleMembershipUpdated,
  handleMembershipCreated,
} from "./events/membership.js";
import { WebhookEvent, MembershipEventData } from "../types/webhook-events.js";

const router = Router();

// Apply signature verification to all webhook routes
router.use(verifyWhopSignature);

router.post("/whop", async (req: Request, res: Response) => {
  const event = req.body as WebhookEvent<MembershipEventData>;

  console.log(`\n📬 Webhook received: ${event.type}`);
  console.log(`   Timestamp: ${new Date(event.created_at * 1000).toISOString()}`);

  try {
    let result: unknown;

    switch (event.type) {
      case "membership.went_valid":
        result = await handleMembershipValid(event.data);
        break;

      case "membership.went_invalid":
        result = await handleMembershipInvalid(event.data);
        break;

      case "membership.updated":
        result = await handleMembershipUpdated(event.data);
        break;

      case "membership.created":
        result = await handleMembershipCreated(event.data);
        break;

      default:
        console.log(`   Unhandled event type: ${event.type}`);
        result = { action: "ignored", reason: "unhandled_event_type" };
    }

    console.log(`   Result:`, result);
    res.json({ received: true, result });

  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).json({
      received: true,
      error: "Handler failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
```

### 5. Update Main Entry Point

Update `src/index.ts`:

```typescript
import express from "express";
import dotenv from "dotenv";
import webhookRouter from "./webhooks/whop-handler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// Webhooks
app.use("/webhooks", webhookRouter);

// API placeholder
app.get("/api", (_req, res) => {
  res.json({
    name: "Whop Clipping Agency API",
    version: "1.0.0",
    endpoints: [
      "GET /health",
      "POST /webhooks/whop",
      "GET /api",
    ],
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Webhooks: POST http://localhost:${PORT}/webhooks/whop`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}\n`);
});
```

---

## Success Criteria

- [ ] POST `/webhooks/whop` endpoint working
- [ ] Signature verification rejects invalid signatures
- [ ] Valid signatures are accepted
- [ ] `membership.went_valid` triggers onboarding log
- [ ] `membership.went_invalid` triggers access revoke log
- [ ] `membership.updated` triggers update log
- [ ] All events logged with timestamps

---

## Testing

Use the `/test-webhook` command or manually:

```bash
# Generate signature
SECRET="your_webhook_secret"
PAYLOAD='{"type":"membership.went_valid","data":{"membership_id":"mem_test","user_id":"user_test","user_email":"test@example.com","product_id":"prod_test","plan_id":"plan_test","valid":true,"metadata":{"company_name":"Test Co"}},"created_at":1699999999}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# Send test webhook
curl -X POST http://localhost:3000/webhooks/whop \
  -H "Content-Type: application/json" \
  -H "whop-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

---

## Completion

Create `docs/phases/PHASE_2_COMPLETE.md`:

```markdown
# Phase 2: Webhook Handler - COMPLETE

**Completed:** [DATE]

## Deliverables
- [x] src/types/webhook-events.ts - Event type definitions
- [x] src/webhooks/middleware/verify-signature.ts - Signature verification
- [x] src/webhooks/events/membership.ts - Membership handlers
- [x] src/webhooks/whop-handler.ts - Webhook router
- [x] Updated src/index.ts with webhook routes

## Events Handled
- membership.went_valid
- membership.went_invalid
- membership.updated
- membership.created

## Verification
- `npm run typecheck`: ✅
- Signature verification: ✅
- Test webhooks received: ✅

## Next Phase
Proceed to Phase 3: Clipper Application System
```

Then commit:
```bash
git add -A && git commit -m "Phase 2: Webhook handler complete"
```

Or use: `/commit feat Phase 2 webhook handler complete`
