import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';

const router = Router();

// Whop webhook event types
type WhopEventType =
  | 'membership.went_valid'
  | 'membership.went_invalid'
  | 'membership.experience_claimed'
  | 'payment.succeeded'
  | 'payment.failed';

interface WhopWebhookPayload {
  action: WhopEventType;
  data: {
    id: string;
    user_id?: string;
    product_id?: string;
    plan_id?: string;
    email?: string;
    discord_id?: string;
    [key: string]: unknown;
  };
  nonce: string;
  timestamp: number;
}

/**
 * Verify Whop webhook signature
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) {
    console.warn('[Webhook] WHOP_WEBHOOK_SECRET not set, skipping verification');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handle membership went valid (new/renewed subscription)
 */
async function handleMembershipValid(data: WhopWebhookPayload['data']): Promise<void> {
  console.log(`[Webhook] Membership valid: ${data.id}`);
  console.log(`  User: ${data.user_id || 'unknown'}`);
  console.log(`  Product: ${data.product_id || 'unknown'}`);

  // TODO: Provision Drive folder for new member
  // TODO: Send welcome notification
}

/**
 * Handle membership went invalid (canceled/expired)
 */
async function handleMembershipInvalid(data: WhopWebhookPayload['data']): Promise<void> {
  console.log(`[Webhook] Membership invalid: ${data.id}`);
  console.log(`  User: ${data.user_id || 'unknown'}`);

  // TODO: Revoke Drive folder access
  // TODO: Send cancellation notification
}

/**
 * Handle experience claimed (user joined experience)
 */
async function handleExperienceClaimed(data: WhopWebhookPayload['data']): Promise<void> {
  console.log(`[Webhook] Experience claimed: ${data.id}`);
  console.log(`  User: ${data.user_id || 'unknown'}`);

  // TODO: Grant access to specific features
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(data: WhopWebhookPayload['data']): Promise<void> {
  console.log(`[Webhook] Payment succeeded: ${data.id}`);
  // Log for analytics/tracking
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(data: WhopWebhookPayload['data']): Promise<void> {
  console.log(`[Webhook] Payment failed: ${data.id}`);
  console.log(`  User: ${data.user_id || 'unknown'}`);

  // TODO: Send payment reminder notification
}

/**
 * POST /webhooks/whop
 * Handle incoming Whop webhooks
 */
router.post('/', async (req: Request, res: Response) => {
  const signature = req.headers['x-whop-signature'] as string;
  const rawBody = req.body;

  // Verify signature if secret is set
  const secret = process.env.WHOP_WEBHOOK_SECRET || '';
  if (secret && signature) {
    const bodyString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    if (!verifySignature(bodyString, signature, secret)) {
      console.error('[Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  // Parse payload
  let payload: WhopWebhookPayload;
  try {
    payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  } catch (error) {
    console.error('[Webhook] Failed to parse payload');
    return res.status(400).json({ error: 'Invalid payload' });
  }

  console.log(`\n[Webhook] Received event: ${payload.action}`);

  // Respond immediately to acknowledge receipt
  res.status(200).json({ received: true });

  // Process event asynchronously
  try {
    switch (payload.action) {
      case 'membership.went_valid':
        await handleMembershipValid(payload.data);
        break;

      case 'membership.went_invalid':
        await handleMembershipInvalid(payload.data);
        break;

      case 'membership.experience_claimed':
        await handleExperienceClaimed(payload.data);
        break;

      case 'payment.succeeded':
        await handlePaymentSucceeded(payload.data);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.data);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${payload.action}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Webhook] Error processing ${payload.action}: ${errorMessage}`);
  }
});

export default router;
