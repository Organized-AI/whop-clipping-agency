# Phase 2: Webhook Handler

## Claude Code Command
```bash
claude --dangerously-skip-permissions
```

## Instructions

Create webhook handlers for Whop membership lifecycle events.

### 1. Create src/webhooks/middleware/verify-signature.ts
Verify webhook authenticity:
```typescript
import crypto from "crypto";

export function verifyWhopSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

### 2. Create src/types/webhook-events.ts
Define event types:
```typescript
export type WebhookEvent = 
  | MembershipWentValid
  | MembershipWentInvalid
  | MembershipUpdated
  | MembershipCreated;

export interface MembershipWentValid {
  type: "membership.went_valid";
  data: {
    membership_id: string;
    product_id: string;
    user_id: string;
    user_email: string;
    plan_id: string;
    metadata: Record<string, any>;
  };
}
// ... other event types
```

### 3. Create src/webhooks/events/membership.ts
Event handlers:
```typescript
export async function handleMembershipValid(event: MembershipWentValid) {
  // 1. Get membership details
  // 2. Determine tier from product_id
  // 3. Create client record in database
  // 4. Trigger Drive folder creation (Phase 4)
  // 5. Send welcome notification (Phase 6)
  // 6. Log for admin dashboard
}

export async function handleMembershipInvalid(event: MembershipWentInvalid) {
  // 1. Update client status
  // 2. Revoke clipper access to folder
  // 3. Archive project files
  // 4. Send notification
}

export async function handleMembershipUpdated(event: MembershipUpdated) {
  // 1. Check if tier changed
  // 2. Update clip quota
  // 3. Adjust clipper assignments if needed
  // 4. Notify relevant parties
}
```

### 4. Create src/webhooks/whop-handler.ts
Main webhook router:
```typescript
import express from "express";
import { verifyWhopSignature } from "./middleware/verify-signature";
import * as membership from "./events/membership";

const router = express.Router();

router.post("/whop", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["whop-signature"] as string;
  const payload = req.body.toString();

  if (!verifyWhopSignature(payload, signature, process.env.WHOP_WEBHOOK_SECRET!)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = JSON.parse(payload);
  
  try {
    switch (event.type) {
      case "membership.went_valid":
        await membership.handleMembershipValid(event);
        break;
      case "membership.went_invalid":
        await membership.handleMembershipInvalid(event);
        break;
      case "membership.updated":
        await membership.handleMembershipUpdated(event);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Processing failed" });
  }
});

export default router;
```

### 5. Update src/index.ts
Mount webhook router:
```typescript
import webhookRouter from "./webhooks/whop-handler";
app.use("/webhooks", webhookRouter);
```

## Testing
Use ngrok or similar to expose local server:
```bash
ngrok http 3000
```
Configure webhook URL in Whop dashboard: `https://xxx.ngrok.io/webhooks/whop`

## Expected Output
- Webhook endpoint at POST /webhooks/whop
- Signature verification working
- Event routing to appropriate handlers
- Placeholder actions ready for Phase 4-6 integration
